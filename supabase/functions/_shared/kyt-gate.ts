/**
 * TranSight KYT Gate — Atomic KYT 연동 모듈
 * 
 * 기존 TranSight KYT API (POST /ts/api/blacklist/wallet)를 호출하여
 * 지갑주소의 위험도를 평가하고, BLOCK/PASS 결정을 반환합니다.
 * 
 * Atomic 처리:
 *   KYT BLOCK → TR 전송 즉시 중단, PII 절대 미전송
 *   KYT PASS  → TR 전송 진행
 * 
 * @see docs/TRANSIGHT_PROJECT_CONTEXT.md (섹션 8.1 Atomic 처리)
 */

// ============================================================
// Types
// ============================================================

export interface KytCheckRequest {
  /** 수신인 지갑 주소 */
  address: string;
  /** 가상자산 심볼 (BTC, ETH, ...) */
  currency: string;
  /** 전송 수량 */
  amount?: string;
  /** 수신 VASP entity ID */
  beneficiaryVaspEntityId?: string;
  /** 네트워크 (멀티네트워크 코인) */
  network?: string;
  /** TR 연계 시 transferId */
  transferId?: string;
}

export interface KytCheckResult {
  /** PASS: 안전, BLOCK: 위험 차단, WARN: 경고(통과) */
  decision: 'PASS' | 'BLOCK' | 'WARN';
  /** 위험도 점수 (0~100, 높을수록 위험) */
  riskScore: number;
  /** 위험 카테고리 (해당 시) */
  riskCategory?: string;
  /** 위험 라벨 (예: "darknet", "mixer", "sanctioned") */
  riskLabels?: string[];
  /** 차단 사유 메시지 */
  blockReason?: string;
  /** KYT 검사 수행 시각 */
  checkedAt: string;
  /** KYT 제공자 */
  provider: string;
  /** 원본 API 응답 (감사용) */
  rawResponse?: Record<string, unknown>;
}

// ============================================================
// Configuration
// ============================================================

interface KytConfig {
  baseUrl: string;
  apiKey: string;
  /** 차단 임계값 (이 점수 이상이면 BLOCK) */
  blockThreshold: number;
  /** 경고 임계값 (이 점수 이상이면 WARN) */
  warnThreshold: number;
  /** KYT 비활성화 (테스트용) */
  disabled: boolean;
  /** 타임아웃 (ms) */
  timeoutMs: number;
}

function getKytConfig(): KytConfig {
  return {
    baseUrl: Deno.env.get('KYT_API_BASE_URL') || '',
    apiKey: Deno.env.get('KYT_API_KEY') || '',
    blockThreshold: parseInt(Deno.env.get('KYT_BLOCK_THRESHOLD') || '80', 10),
    warnThreshold: parseInt(Deno.env.get('KYT_WARN_THRESHOLD') || '50', 10),
    disabled: Deno.env.get('KYT_DISABLED') === 'true',
    timeoutMs: parseInt(Deno.env.get('KYT_TIMEOUT_MS') || '5000', 10),
  };
}

// ============================================================
// HMAC-SHA256 Signature (TranSight KYT 인증용)
// ============================================================

async function createKytSignature(
  apiKey: string,
  timestamp: string,
  body: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${timestamp}${body}`);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================
// Core KYT Check
// ============================================================

/**
 * TranSight KYT API 호출 — 지갑주소 위험 판별
 * 
 * POST /ts/api/blacklist/wallet
 * 
 * @param request KYT 검사 요청
 * @returns KYT 검사 결과 (PASS/BLOCK/WARN)
 */
export async function checkKyt(request: KytCheckRequest): Promise<KytCheckResult> {
  const config = getKytConfig();
  const checkedAt = new Date().toISOString();

  // KYT 비활성화 모드 (테스트/개발용)
  if (config.disabled) {
    console.log('[KYT Gate] KYT disabled — auto PASS');
    return {
      decision: 'PASS',
      riskScore: 0,
      checkedAt,
      provider: 'transight-kyt-disabled',
    };
  }

  // KYT API 미설정 → fallback PASS (경고 로그)
  if (!config.baseUrl || !config.apiKey) {
    console.warn('[KYT Gate] KYT_API_BASE_URL or KYT_API_KEY not set — fallback PASS');
    return {
      decision: 'PASS',
      riskScore: 0,
      checkedAt,
      provider: 'transight-kyt-unconfigured',
    };
  }

  // KYT API 호출
  const url = `${config.baseUrl}/ts/api/blacklist/wallet`;
  const timestamp = new Date().toISOString();

  const body = JSON.stringify({
    address: request.address,
    currency: request.currency.toUpperCase(),
    amount: request.amount,
    network: request.network,
    // TR 연계 블록 (하위 호환 — tr 블록이 없으면 기존 KYT 단독 동작)
    ...(request.transferId ? {
      tr: {
        transferId: request.transferId,
        beneficiaryVaspEntityId: request.beneficiaryVaspEntityId,
      },
    } : {}),
  });

  const signature = await createKytSignature(config.apiKey, timestamp, body);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
        'X-Timestamp': timestamp,
        'X-Signature': signature,
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[KYT Gate] API error ${res.status}: ${errBody}`);
      // KYT API 장애 시 fail-open (PASS + 경고)
      // 규제 요구사항에 따라 fail-close(BLOCK)로 변경 가능
      return {
        decision: 'PASS',
        riskScore: 0,
        blockReason: `KYT API error: ${res.status}`,
        checkedAt,
        provider: 'transight-kyt-error',
        rawResponse: { status: res.status, body: errBody.slice(0, 500) },
      };
    }

    const data = await res.json() as Record<string, unknown>;

    // TranSight KYT 응답 해석
    const riskScore = (data.riskScore as number) ?? (data.risk_score as number) ?? 0;
    const riskCategory = (data.riskCategory as string) ?? (data.category as string);
    const riskLabels = (data.riskLabels as string[]) ?? (data.labels as string[]) ?? [];
    const isBlacklisted = (data.isBlacklisted as boolean) ?? (data.blacklisted as boolean) ?? false;

    // 결정 로직
    let decision: 'PASS' | 'BLOCK' | 'WARN';
    let blockReason: string | undefined;

    if (isBlacklisted || riskScore >= config.blockThreshold) {
      decision = 'BLOCK';
      blockReason = isBlacklisted
        ? `Address is blacklisted: ${riskLabels.join(', ') || riskCategory || 'unknown'}`
        : `Risk score ${riskScore} exceeds block threshold ${config.blockThreshold}`;
    } else if (riskScore >= config.warnThreshold) {
      decision = 'WARN';
    } else {
      decision = 'PASS';
    }

    console.log(`[KYT Gate] ${request.address} → ${decision} (score: ${riskScore}, labels: ${riskLabels.join(',')})`);

    return {
      decision,
      riskScore,
      riskCategory,
      riskLabels: riskLabels.length > 0 ? riskLabels : undefined,
      blockReason,
      checkedAt,
      provider: 'transight-kyt',
      rawResponse: data,
    };

  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.error(`[KYT Gate] Timeout (${config.timeoutMs}ms) for ${request.address}`);
    } else {
      console.error(`[KYT Gate] Connection error:`, err);
    }

    // 장애 시 fail-open
    return {
      decision: 'PASS',
      riskScore: 0,
      blockReason: `KYT connection failed: ${err instanceof Error ? err.message : 'timeout'}`,
      checkedAt,
      provider: 'transight-kyt-timeout',
    };
  }
}

// ============================================================
// Atomic Gate (KYT + TR 통합 결정)
// ============================================================

export interface AtomicGateResult {
  /** 최종 결정: proceed(TR 진행) / block(TR 차단) */
  finalDecision: 'proceed' | 'block';
  /** KYT 상세 결과 */
  kytResult: KytCheckResult;
  /** 차단 시 사유 */
  blockReason?: string;
}

/**
 * Atomic Gate — KYT 검사 후 TR 진행/차단 결정
 * 
 * BLOCK → PII 절대 미전송, transfer denied 처리
 * WARN  → 경고 로그 남기고 TR 진행 (규정 준수)
 * PASS  → TR 정상 진행
 * 
 * @param request KYT 검사 요청
 * @returns 최종 결정 + KYT 상세 결과
 */
export async function atomicGate(request: KytCheckRequest): Promise<AtomicGateResult> {
  const kytResult = await checkKyt(request);

  if (kytResult.decision === 'BLOCK') {
    console.warn(`[Atomic Gate] ⛔ BLOCKED: ${request.address} — ${kytResult.blockReason}`);
    return {
      finalDecision: 'block',
      kytResult,
      blockReason: kytResult.blockReason,
    };
  }

  if (kytResult.decision === 'WARN') {
    console.warn(`[Atomic Gate] ⚠️ WARNING: ${request.address} — score ${kytResult.riskScore}`);
  }

  return {
    finalDecision: 'proceed',
    kytResult,
  };
}

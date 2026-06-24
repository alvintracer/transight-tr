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
  /** RA 모델 코드 — ra_code1 (상위 분류: BL, HRA 등) */
  raCode1?: string;
  /** RA 모델 코드 — ra_code2 (위험/특성 유형: OIS, DIS, RW 등) */
  raCode2?: string;
  /** RA 모델 코드 — ra_code3 (개별 주체명: Lazarus 등) */
  raCode3?: string;
  /** risk_analysis_type: Direct 또는 Tracked */
  riskAnalysisType?: string;
  /** 추적 홉 수 (0=직접, 1~3=추적) */
  hopCount?: number;
  /** 차단 사유 메시지 */
  blockReason?: string;
  /** KYT 검사 수행 시각 */
  checkedAt: string;
  /** KYT 제공자 */
  provider: string;
  /** 원본 API 응답 (감사용) */
  rawResponse?: Record<string, unknown>;
}

/** VASP별 KYT 설정 (vasps 테이블에서 조회) */
export interface VaspKytConfig {
  /** KYT 운영 모드: none(TR만) / kyt_only(KYT만) / atomic(KYT+TR 통합) */
  kytMode: 'none' | 'kyt_only' | 'atomic';
  /** KYT 적용 범위: tr_only(TR 대상만) / all(전체) */
  kytScope: 'tr_only' | 'all';
  /** 자동 차단: true면 등록된 ra_code2 매칭 시 자동 BLOCK */
  kytAutoBlock: boolean;
  /** SAR 리턴: true면 차단 시 상세 RA 정보 포함 */
  kytReturnForSar: boolean;
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

    // RA 모델 코드 추출 (TranSight KYT v1.3.3+)
    const raCode1 = (data.ra_code1 as string) ?? (data.raCode1 as string);
    const raCode2 = (data.ra_code2 as string) ?? (data.raCode2 as string);
    const raCode3 = (data.ra_code3 as string) ?? (data.raCode3 as string);
    const riskAnalysisType = (data.risk_analysis_type as string) ?? (data.riskAnalysisType as string);
    const hopCount = (data.hop_count as number) ?? (data.hopCount as number);

    // 결정 로직 (기본: riskScore 기반)
    let decision: 'PASS' | 'BLOCK' | 'WARN';
    let blockReason: string | undefined;

    if (isBlacklisted || riskScore >= config.blockThreshold) {
      decision = 'BLOCK';
      blockReason = isBlacklisted
        ? `Address is blacklisted: ${raCode2 || riskLabels.join(', ') || riskCategory || 'unknown'}`
        : `Risk score ${riskScore} exceeds block threshold ${config.blockThreshold}`;
    } else if (riskScore >= config.warnThreshold) {
      decision = 'WARN';
    } else {
      decision = 'PASS';
    }

    console.log(`[KYT Gate] ${request.address} → ${decision} (score: ${riskScore}, ra_code2: ${raCode2 ?? 'N/A'}, labels: ${riskLabels.join(',')})`);

    return {
      decision,
      riskScore,
      riskCategory,
      riskLabels: riskLabels.length > 0 ? riskLabels : undefined,
      raCode1,
      raCode2,
      raCode3,
      riskAnalysisType,
      hopCount,
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
  /** ra_code2 매칭으로 인한 차단인지 */
  blockedByRegistry?: boolean;
  /** 매칭된 차단 레지스트리 항목 */
  matchedRegistryEntry?: { ra_code2: string; description?: string };
}

/** Block Registry 항목 */
interface BlockRegistryEntry {
  ra_code2: string;
  risk_analysis_type: string | null;
  max_hop_count: number | null;
  description: string | null;
  is_active: boolean;
}

/**
 * Atomic Gate — VASP 설정 기반 KYT + TR 통합 결정
 * 
 * kyt_mode:
 *   'none'     → KYT 스킵, TR만 진행
 *   'kyt_only' → KYT만 수행 (TR과 별개)
 *   'atomic'   → KYT 결과에 따라 TR 차단/진행
 * 
 * kyt_auto_block:
 *   true  → 등록된 ra_code2 매칭 시 자동 차단 (PII 미전송)
 *   false → KYT 결과만 리턴, TR은 그냥 진행
 * 
 * @param request KYT 검사 요청
 * @param vaspConfig VASP별 KYT 설정 (없으면 기본값)
 * @param blockRegistry VASP의 차단 대상 ra_code2 목록 (DB에서 조회)
 * @returns 최종 결정 + KYT 상세 결과
 */
export async function atomicGate(
  request: KytCheckRequest,
  vaspConfig?: VaspKytConfig,
  blockRegistry?: BlockRegistryEntry[],
): Promise<AtomicGateResult> {
  // 기본 설정 (하위 호환: config 없으면 기존 동작)
  const config: VaspKytConfig = vaspConfig ?? {
    kytMode: 'atomic',
    kytScope: 'tr_only',
    kytAutoBlock: true,
    kytReturnForSar: false,
  };

  // kyt_mode === 'none' → KYT 스킵, TR만 진행
  if (config.kytMode === 'none') {
    console.log(`[Atomic Gate] KYT disabled for this VASP — proceeding without KYT`);
    return {
      finalDecision: 'proceed',
      kytResult: {
        decision: 'PASS',
        riskScore: 0,
        checkedAt: new Date().toISOString(),
        provider: 'transight-kyt-disabled',
      },
    };
  }

  // KYT API 호출
  const kytResult = await checkKyt(request);

  // kyt_auto_block === false → KYT 결과만 리턴, TR은 그냥 진행
  if (!config.kytAutoBlock) {
    console.log(`[Atomic Gate] auto_block OFF — returning KYT result only (ra_code2: ${kytResult.raCode2 ?? 'N/A'}, score: ${kytResult.riskScore})`);
    return {
      finalDecision: 'proceed',
      kytResult,
    };
  }

  // === 자동 차단 로직 (kyt_auto_block === true) ===

  // 1. 기존 riskScore 기반 차단 (기본 임계값)
  if (kytResult.decision === 'BLOCK') {
    console.warn(`[Atomic Gate] ⛔ BLOCKED by riskScore: ${request.address} — ${kytResult.blockReason}`);
    return {
      finalDecision: 'block',
      kytResult,
      blockReason: kytResult.blockReason,
    };
  }

  // 2. ra_code2 기반 차단 (Block Registry 매칭)
  if (kytResult.raCode2 && blockRegistry && blockRegistry.length > 0) {
    const matchedEntry = blockRegistry.find(entry => {
      if (!entry.is_active) return false;
      if (entry.ra_code2 !== kytResult.raCode2) return false;

      // risk_analysis_type 필터 (NULL이면 모든 유형에 적용)
      if (entry.risk_analysis_type && kytResult.riskAnalysisType) {
        if (entry.risk_analysis_type !== kytResult.riskAnalysisType) return false;
      }

      // max_hop_count 필터 (NULL이면 모든 홉에 적용)
      if (entry.max_hop_count != null && kytResult.hopCount != null) {
        if (kytResult.hopCount > entry.max_hop_count) return false;
      }

      return true;
    });

    if (matchedEntry) {
      const reason = `Blocked by ra_code2 registry: ${kytResult.raCode2}` +
        (kytResult.raCode3 ? ` (${kytResult.raCode3})` : '') +
        (kytResult.riskAnalysisType ? `, ${kytResult.riskAnalysisType}` : '') +
        (kytResult.hopCount != null ? `, hop ${kytResult.hopCount}` : '');

      console.warn(`[Atomic Gate] ⛔ BLOCKED by registry: ${request.address} — ${reason}`);

      return {
        finalDecision: 'block',
        kytResult: { ...kytResult, decision: 'BLOCK', blockReason: reason },
        blockReason: reason,
        blockedByRegistry: true,
        matchedRegistryEntry: {
          ra_code2: matchedEntry.ra_code2,
          description: matchedEntry.description ?? undefined,
        },
      };
    }
  }

  // 3. WARN은 로그만 남기고 진행
  if (kytResult.decision === 'WARN') {
    console.warn(`[Atomic Gate] ⚠️ WARNING: ${request.address} — ra_code2: ${kytResult.raCode2 ?? 'N/A'}, score: ${kytResult.riskScore}`);
  }

  return {
    finalDecision: 'proceed',
    kytResult,
  };
}

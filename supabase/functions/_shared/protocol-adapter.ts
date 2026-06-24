/**
 * Protocol Adapter — 비대칭 브릿지 핵심
 * 
 * 수신 VASP의 alliance_name에 따라 적절한 프로토콜로 TR 메시지를 라우팅합니다.
 * 
 * 지원 프로토콜:
 *   - code       → CODE VASP API (trapi.codevasp.com)
 *   - sumsub     → Sumsub Travel Rule API (TRUST 프로토콜 게이트웨이)
 *   - verifyvasp → VerifyVASP API (향후 구현)
 *   - transight  → TranSight 내부 네트워크 (DB 직접 조회)
 *   - direct     → 직접 HTTPS/mTLS 연결
 * 
 * 각 어댑터는 TransferRequest를 받아 TransferResponse를 반환합니다.
 * transfer-auth에서 이 모듈을 호출하여 실제 VASP간 통신을 수행합니다.
 */

// ============================================================
// Types
// ============================================================

/** GTR Adapter Options (클라이언트가 GTR 관련 파라미터 지정 시 사용) */
export interface GtrAdapterOptions {
  mode?: 'PII_VERIFICATION' | 'REENCRYPT_TO_GTR';
  verifyDirection?: number;
  targetVaspCode?: string;
  initiatorPublicKey?: string;
  targetVaspPublicKey?: string;
  expectVerifyFields?: string[];
  payloadFormat?: 'GTR_CURVE25519_ENCRYPTED';
  lawThresholdEnabled?: boolean;
  piiSecuredInfo?: Record<string, unknown>;
}

export interface AdapterTransferRequest {
  transferId: string;
  currency: string;
  amount: string;
  tradePrice?: string;
  tradeCurrency?: string;
  isExceedingThreshold?: boolean;
  payload: string;              // 암호화된 IVMS101
  address?: string;
  tag?: string;
  network?: string;
  originatorVaspEntityId?: string;
  /** 어댑터별 추가 옵션 */
  adapterOptions?: {
    gtr?: GtrAdapterOptions;
  };
}

export interface AdapterTransferResponse {
  result: 'verified' | 'denied' | 'pending';
  reasonType?: string;
  reasonMsg?: string;
  payload?: string;              // 수신 VASP의 암호화 응답
  remoteTransferId?: string;     // 수신 VASP 측 transfer ID
  protocol: string;              // 사용된 프로토콜
  latencyMs: number;             // 응답 시간
}

export interface VaspTarget {
  vaspEntityId: string;
  vaspName: string;
  allianceName: string;
  endpointUrl?: string;
  channelType: string;
  publicKey?: string;
  health: string;
}

// ============================================================
// Adapter Interface
// ============================================================

interface ProtocolAdapter {
  name: string;
  /** TR 인가 요청 전달 */
  sendTransferAuth(
    target: VaspTarget,
    request: AdapterTransferRequest,
    hubPrivateKey: string,
    hubVaspEntityId: string,
  ): Promise<AdapterTransferResponse>;

  /** TXID 결과 보고 */
  sendTransferResult(
    target: VaspTarget,
    transferId: string,
    txid: string,
    vout?: string,
  ): Promise<{ success: boolean; error?: string }>;

  /** 전송 취소 */
  sendTransferFinish(
    target: VaspTarget,
    transferId: string,
    reasonType?: string,
    reasonMsg?: string,
  ): Promise<{ success: boolean; error?: string }>;
}

// ============================================================
// CODE VASP Adapter
// ============================================================

class CodeVaspAdapter implements ProtocolAdapter {
  name = 'code';

  private baseUrl: string;

  constructor() {
    this.baseUrl = Deno.env.get('CODE_API_BASE_URL') || 'https://trapi-dev.codevasp.com';
  }

  async sendTransferAuth(
    target: VaspTarget,
    request: AdapterTransferRequest,
    hubPrivateKey: string,
    hubVaspEntityId: string,
  ): Promise<AdapterTransferResponse> {
    const startTime = Date.now();
    const url = `${this.baseUrl}/v1/code/transfer/${target.vaspEntityId}`;

    const body = JSON.stringify({
      transferId: request.transferId,
      currency: request.currency,
      amount: request.amount,
      tradePrice: request.tradePrice ?? '0',
      tradeCurrency: request.tradeCurrency ?? 'KRW',
      isExceedingThreshold: request.isExceedingThreshold ?? false,
      payload: request.payload,
      address: request.address,
      tag: request.tag,
      network: request.network,
    });

    // CODE VASP 헤더 서명 생성
    const headers = buildCodeHeaders(hubPrivateKey, hubVaspEntityId, body, target.publicKey);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body,
      });

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const errBody = await res.text();
        return {
          result: 'denied',
          reasonType: 'PROTOCOL_ERROR',
          reasonMsg: `CODE API ${res.status}: ${errBody}`,
          protocol: 'code',
          latencyMs,
        };
      }

      const data = await res.json() as Record<string, unknown>;
      return {
        result: (data.result as string) === 'verified' ? 'verified' : 'denied',
        reasonType: data.reasonType as string | undefined,
        reasonMsg: data.reasonMsg as string | undefined,
        payload: data.payload as string | undefined,
        remoteTransferId: data.transferId as string | undefined,
        protocol: 'code',
        latencyMs,
      };
    } catch (err) {
      return {
        result: 'denied',
        reasonType: 'CONNECTION_ERROR',
        reasonMsg: `Failed to reach CODE API: ${err instanceof Error ? err.message : 'Unknown'}`,
        protocol: 'code',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async sendTransferResult(
    target: VaspTarget,
    transferId: string,
    txid: string,
    vout?: string,
  ) {
    const url = `${this.baseUrl}/v1/code/transfer/result/${target.vaspEntityId}`;
    const body = JSON.stringify({ transferId, txid, vout });

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      return { success: res.ok, error: res.ok ? undefined : `${res.status}` };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown' };
    }
  }

  async sendTransferFinish(
    target: VaspTarget,
    transferId: string,
    reasonType?: string,
    reasonMsg?: string,
  ) {
    const url = `${this.baseUrl}/v1/code/transfer/finish/${transferId}`;
    const body = JSON.stringify({ transferId, result: 'canceled', reasonType, reasonMsg });

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      return { success: res.ok, error: res.ok ? undefined : `${res.status}` };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown' };
    }
  }
}

// ============================================================
// VerifyVASP Adapter (향후 구현)
// ============================================================

class VerifyVaspAdapter implements ProtocolAdapter {
  name = 'verifyvasp';

  async sendTransferAuth(
    target: VaspTarget,
    request: AdapterTransferRequest,
  ): Promise<AdapterTransferResponse> {
    // TODO: VerifyVASP 프로토콜 구현
    // VerifyVASP는 gRPC 기반이므로 별도 클라이언트 필요
    return {
      result: 'pending',
      reasonType: 'NOT_IMPLEMENTED',
      reasonMsg: 'VerifyVASP protocol adapter is not yet implemented',
      protocol: 'verifyvasp',
      latencyMs: 0,
    };
  }

  async sendTransferResult() {
    return { success: false, error: 'Not implemented' };
  }

  async sendTransferFinish() {
    return { success: false, error: 'Not implemented' };
  }
}

// ============================================================
// Sumsub Travel Rule Adapter (TRUST 프로토콜 게이트웨이)
// ============================================================

class SumsubAdapter implements ProtocolAdapter {
  name = 'sumsub';

  private baseUrl: string;
  private appToken: string;
  private secretKey: string;

  constructor() {
    this.baseUrl = Deno.env.get('SUMSUB_API_BASE_URL') || 'https://api.sumsub.com';
    this.appToken = Deno.env.get('SUMSUB_APP_TOKEN') || '';
    this.secretKey = Deno.env.get('SUMSUB_SECRET_KEY') || '';
  }

  /**
   * HMAC-SHA256 서명 생성 (Sumsub 인증)
   * sig = HMAC-SHA256(secretKey, timestamp + method + uri + body)
   */
  private async createSignature(
    method: string,
    uri: string,
    body: string,
    timestamp: number,
  ): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${timestamp}${method}${uri}${body}`);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, data);
    // hex encode
    return Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Sumsub API 인증 헤더 생성
   */
  private async buildHeaders(
    method: string,
    uri: string,
    body: string,
  ): Promise<Record<string, string>> {
    const ts = Math.floor(Date.now() / 1000);
    const sig = await this.createSignature(method, uri, body, ts);

    return {
      'Content-Type': 'application/json',
      'X-App-Token': this.appToken,
      'X-App-Access-Ts': ts.toString(),
      'X-App-Access-Sig': sig,
    };
  }

  async sendTransferAuth(
    target: VaspTarget,
    request: AdapterTransferRequest,
    hubPrivateKey: string,
    hubVaspEntityId: string,
  ): Promise<AdapterTransferResponse> {
    const startTime = Date.now();

    if (!this.appToken || !this.secretKey) {
      return {
        result: 'denied',
        reasonType: 'SUMSUB_NOT_CONFIGURED',
        reasonMsg: 'Sumsub credentials not set (SUMSUB_APP_TOKEN / SUMSUB_SECRET_KEY)',
        protocol: 'sumsub',
        latencyMs: Date.now() - startTime,
      };
    }

    // Sumsub Travel Rule 트랜잭션 생성
    // POST /resources/applicants/{applicantId}/kyt/txns/-/data
    // applicantId는 Hub 자체 ID 사용 (VASP 레벨 트랜잭션)
    const applicantId = Deno.env.get('SUMSUB_APPLICANT_ID') || hubVaspEntityId;
    const uri = `/resources/applicants/${applicantId}/kyt/txns/-/data`;

    const txnBody = JSON.stringify({
      type: 'travelRule',
      txnId: request.transferId,
      txnDate: new Date().toISOString(),
      direction: 'out',
      amount: parseFloat(request.amount),
      currencyCode: request.currency,
      props: {
        // Originator 정보 (송신 VASP)
        direction: 'out',
        originatorVaspEntityId: request.originatorVaspEntityId ?? hubVaspEntityId,
        // Beneficiary 정보 (수신측)
        beneficiaryVaspEntityId: target.vaspEntityId,
        beneficiaryVaspName: target.vaspName,
        // 지갑 주소
        address: request.address ?? '',
        tag: request.tag ?? '',
        network: request.network ?? '',
        // IVMS101 payload (암호화된 상태 전달)
        payload: request.payload,
        // 거래 정보
        tradePrice: request.tradePrice ?? '0',
        tradeCurrency: request.tradeCurrency ?? 'KRW',
        isExceedingThreshold: request.isExceedingThreshold ?? false,
      },
    });

    const headers = await this.buildHeaders('POST', uri, txnBody);

    try {
      const res = await fetch(`${this.baseUrl}${uri}`, {
        method: 'POST',
        headers,
        body: txnBody,
      });

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const errBody = await res.text();
        return {
          result: 'denied',
          reasonType: 'SUMSUB_ERROR',
          reasonMsg: `Sumsub API ${res.status}: ${errBody.slice(0, 200)}`,
          protocol: 'sumsub',
          latencyMs,
        };
      }

      const data = await res.json() as Record<string, unknown>;

      // Sumsub 응답 해석
      // status: 'pending' | 'completed' | 'rejected' 등
      const status = (data.status as string) ?? 'pending';
      let result: 'verified' | 'denied' | 'pending' = 'pending';

      if (status === 'completed' || status === 'approved') {
        result = 'verified';
      } else if (status === 'rejected' || status === 'declined') {
        result = 'denied';
      } else {
        // pending — Sumsub이 TRUST를 통해 비동기 처리 중
        result = 'pending';
      }

      return {
        result,
        reasonType: result === 'denied' ? (data.rejectReason as string) ?? 'SUMSUB_REJECTED' : undefined,
        reasonMsg: data.reasonMsg as string | undefined,
        remoteTransferId: (data.id as string) ?? (data.txnId as string),
        protocol: 'sumsub',
        latencyMs,
      };
    } catch (err) {
      return {
        result: 'denied',
        reasonType: 'CONNECTION_ERROR',
        reasonMsg: `Failed to reach Sumsub: ${err instanceof Error ? err.message : 'Unknown'}`,
        protocol: 'sumsub',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async sendTransferResult(
    target: VaspTarget,
    transferId: string,
    txid: string,
    vout?: string,
  ) {
    // Sumsub에 TXID 업데이트
    // PATCH /resources/kyt/txns/{txnId}/data
    const uri = `/resources/kyt/txns/${transferId}/data`;
    const body = JSON.stringify({
      props: { txid, vout, status: 'confirmed' },
    });

    try {
      const headers = await this.buildHeaders('PATCH', uri, body);
      const res = await fetch(`${this.baseUrl}${uri}`, {
        method: 'PATCH',
        headers,
        body,
      });
      return { success: res.ok, error: res.ok ? undefined : `Sumsub ${res.status}` };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown' };
    }
  }

  async sendTransferFinish(
    target: VaspTarget,
    transferId: string,
    reasonType?: string,
    reasonMsg?: string,
  ) {
    // Sumsub에 취소 알림
    const uri = `/resources/kyt/txns/${transferId}/data`;
    const body = JSON.stringify({
      props: { status: 'canceled', reasonType, reasonMsg },
    });

    try {
      const headers = await this.buildHeaders('PATCH', uri, body);
      const res = await fetch(`${this.baseUrl}${uri}`, {
        method: 'PATCH',
        headers,
        body,
      });
      return { success: res.ok, error: res.ok ? undefined : `Sumsub ${res.status}` };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown' };
    }
  }
}

// ============================================================
// TranSight Internal Adapter (자체 네트워크)
// ============================================================

class TransightInternalAdapter implements ProtocolAdapter {
  name = 'transight';

  async sendTransferAuth(
    target: VaspTarget,
    request: AdapterTransferRequest,
  ): Promise<AdapterTransferResponse> {
    const startTime = Date.now();

    // TranSight 내부 VASP → DB에 직접 기록하므로 즉시 verified
    // 실제로는 수신 VASP의 Response API로 전달 후 응답 대기
    // 현재는 자동 인가 (내부 네트워크이므로 신뢰)
    return {
      result: 'verified',
      protocol: 'transight',
      latencyMs: Date.now() - startTime,
    };
  }

  async sendTransferResult(
    target: VaspTarget,
    transferId: string,
    txid: string,
    vout?: string,
  ) {
    // 내부 네트워크 — DB 업데이트로 처리됨
    return { success: true };
  }

  async sendTransferFinish(
    target: VaspTarget,
    transferId: string,
    reasonType?: string,
    reasonMsg?: string,
  ) {
    return { success: true };
  }
}

// ============================================================
// Direct HTTPS/mTLS Adapter (개별 연결)
// ============================================================

class DirectAdapter implements ProtocolAdapter {
  name = 'direct';

  async sendTransferAuth(
    target: VaspTarget,
    request: AdapterTransferRequest,
    hubPrivateKey: string,
    hubVaspEntityId: string,
  ): Promise<AdapterTransferResponse> {
    const startTime = Date.now();

    if (!target.endpointUrl) {
      return {
        result: 'denied',
        reasonType: 'NO_ENDPOINT',
        reasonMsg: `VASP "${target.vaspEntityId}" has no endpoint_url configured`,
        protocol: 'direct',
        latencyMs: Date.now() - startTime,
      };
    }

    // Direct 연결 — CODE와 동일 포맷 사용 (상호 합의된 API)
    const body = JSON.stringify({
      transferId: request.transferId,
      currency: request.currency,
      amount: request.amount,
      tradePrice: request.tradePrice ?? '0',
      tradeCurrency: request.tradeCurrency ?? 'KRW',
      isExceedingThreshold: request.isExceedingThreshold ?? false,
      payload: request.payload,
      address: request.address,
      tag: request.tag,
      network: request.network,
      originatorVaspEntityId: request.originatorVaspEntityId ?? hubVaspEntityId,
    });

    const headers = buildCodeHeaders(hubPrivateKey, hubVaspEntityId, body, target.publicKey);

    try {
      const res = await fetch(`${target.endpointUrl}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body,
      });

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        return {
          result: 'denied',
          reasonType: 'PROTOCOL_ERROR',
          reasonMsg: `Direct endpoint ${res.status}`,
          protocol: 'direct',
          latencyMs,
        };
      }

      const data = await res.json() as Record<string, unknown>;
      return {
        result: (data.result as string) === 'verified' ? 'verified' : 'denied',
        reasonType: data.reasonType as string | undefined,
        reasonMsg: data.reasonMsg as string | undefined,
        payload: data.payload as string | undefined,
        protocol: 'direct',
        latencyMs,
      };
    } catch (err) {
      return {
        result: 'denied',
        reasonType: 'CONNECTION_ERROR',
        reasonMsg: `Direct connection failed: ${err instanceof Error ? err.message : 'Unknown'}`,
        protocol: 'direct',
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async sendTransferResult(
    target: VaspTarget,
    transferId: string,
    txid: string,
    vout?: string,
  ) {
    if (!target.endpointUrl) return { success: false, error: 'No endpoint' };

    try {
      const res = await fetch(`${target.endpointUrl}/transfer/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferId, txid, vout }),
      });
      return { success: res.ok };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown' };
    }
  }

  async sendTransferFinish(
    target: VaspTarget,
    transferId: string,
    reasonType?: string,
    reasonMsg?: string,
  ) {
    if (!target.endpointUrl) return { success: false, error: 'No endpoint' };

    try {
      const res = await fetch(`${target.endpointUrl}/transfer/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferId, result: 'canceled', reasonType, reasonMsg }),
      });
      return { success: res.ok };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown' };
    }
  }
}

// ============================================================
// GTR Adapter (Global Travel Rule — PII Verification)
// ============================================================

/** GTR 검증 필드 기본값 */
const GTR_DEFAULT_NATURAL_PERSON_FIELDS = ['110026', '110025'];  // Name + DOB

/** SHA-256 해시 (payload 로깅용, PII 원문 저장 방지) */
async function sha256Safe(input?: string): Promise<string> {
  if (!input) return '';
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

class GtrAdapter implements ProtocolAdapter {
  name = 'gtr';

  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = Deno.env.get('GTR_API_BASE_URL') || 'https://api.globaltravelrule.com';
    this.apiKey = Deno.env.get('GTR_API_KEY') || '';
  }

  async sendTransferAuth(
    target: VaspTarget,
    request: AdapterTransferRequest,
    hubPrivateKey: string,
    hubVaspEntityId: string,
  ): Promise<AdapterTransferResponse> {
    const startTime = Date.now();
    const gtrOpts = request.adapterOptions?.gtr ?? {};

    if (!this.apiKey) {
      return {
        result: 'denied',
        reasonType: 'GTR_NOT_CONFIGURED',
        reasonMsg: 'GTR API Key not set (GTR_API_KEY)',
        protocol: 'gtr',
        latencyMs: Date.now() - startTime,
      };
    }

    // 1. GTR VASP 프로필 조회 (Supabase에서)
    const gtrProfile = await this.loadGtrProfile(target.vaspEntityId);

    if (!gtrProfile) {
      return {
        result: 'denied',
        reasonType: 'VASP_NOT_FOUND',
        reasonMsg: `GTR VASP profile not found for "${target.vaspEntityId}"`,
        protocol: 'gtr',
        latencyMs: Date.now() - startTime,
      };
    }

    if (gtrProfile.status !== 'active') {
      return {
        result: 'denied',
        reasonType: 'VASP_HEALTH_DOWN',
        reasonMsg: `GTR VASP "${gtrProfile.gtr_vasp_code}" is ${gtrProfile.status}`,
        protocol: 'gtr',
        latencyMs: Date.now() - startTime,
      };
    }

    // 2. 공개키 만료 체크
    if (gtrProfile.target_public_key_expires_at) {
      const expiresAt = new Date(gtrProfile.target_public_key_expires_at);
      if (expiresAt < new Date()) {
        return {
          result: 'denied',
          reasonType: 'VASP_KEY_EXPIRED',
          reasonMsg: `GTR target VASP public key expired at ${gtrProfile.target_public_key_expires_at}`,
          protocol: 'gtr',
          latencyMs: Date.now() - startTime,
        };
      }
    }

    // 3. One-Step 요청 빌드
    const gtrRequest = {
      requestId: `TTR-${request.transferId}`,
      ticker: request.currency,
      amount: request.amount,
      address: request.address ?? '',
      tag: request.tag ?? '',
      network: request.network ?? '',
      txId: null,
      verifyDirection: gtrOpts.verifyDirection ?? 2,  // Pre-transaction
      targetVaspCode: gtrOpts.targetVaspCode ?? gtrProfile.gtr_vasp_code,
      encryptedPayload: request.payload,
      initiatorPublicKey: gtrOpts.initiatorPublicKey ?? Deno.env.get('GTR_PUBLIC_KEY') ?? '',
      targetVaspPublicKey: gtrOpts.targetVaspPublicKey ?? gtrProfile.target_public_key ?? '',
      fiatName: request.tradeCurrency ?? 'KRW',
      fiatPrice: request.tradePrice ?? null,
      lawThresholdEnabled: gtrOpts.lawThresholdEnabled ?? request.isExceedingThreshold ?? false,
      expectVerifyFields: gtrOpts.expectVerifyFields ?? GTR_DEFAULT_NATURAL_PERSON_FIELDS,
      piiSecuredInfo: gtrOpts.piiSecuredInfo ?? undefined,
    };

    // 4. GTR API 호출
    try {
      const res = await fetch(`${this.baseUrl}/api/verify/v2/one_step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey,
        },
        body: JSON.stringify(gtrRequest),
        signal: AbortSignal.timeout(10_000),  // 10초 타임아웃
      });

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');

        // GTR 로그 (에러)
        await this.insertGtrLog({
          transferId: target.vaspEntityId,  // Edge Function에서 실제 DB ID로 교체
          gtrRequestId: gtrRequest.requestId,
          targetVaspCode: gtrRequest.targetVaspCode,
          verifyDirection: gtrRequest.verifyDirection,
          requestPayloadHash: await sha256Safe(request.payload),
          latencyMs,
          httpStatus: res.status,
          errorCode: `HTTP_${res.status}`,
          errorMessage: errBody.slice(0, 200),
        });

        return {
          result: 'denied',
          reasonType: 'CHANNEL_ROUTING_FAILED',
          reasonMsg: `GTR API ${res.status}: ${errBody.slice(0, 200)}`,
          protocol: 'gtr',
          latencyMs,
        };
      }

      const gtrResponse = await res.json() as Record<string, unknown>;
      const gtrData = gtrResponse.data as Record<string, unknown> | undefined;
      const verifyFields = (gtrData?.verifyFields as Array<Record<string, unknown>>) ?? [];

      // 5. GTR 로그 (성공)
      await this.insertGtrLog({
        transferId: target.vaspEntityId,
        gtrRequestId: gtrRequest.requestId,
        gtrTravelruleId: gtrData?.travelruleId as string | undefined,
        targetVaspCode: gtrRequest.targetVaspCode,
        verifyDirection: gtrRequest.verifyDirection,
        verifyStatus: gtrResponse.verifyStatus as number | undefined,
        verifyMessage: gtrResponse.verifyMessage as string | undefined,
        verifyFields,
        requestPayloadHash: await sha256Safe(request.payload),
        responsePayloadHash: await sha256Safe(gtrData?.encryptedPayload as string | undefined),
        latencyMs,
        httpStatus: 200,
      });

      // 6. GTR 응답 → TTR 결과 매핑
      const mapped = this.mapGtrToTtrResult(gtrResponse, verifyFields);

      return {
        result: mapped.result,
        reasonType: mapped.reasonType,
        reasonMsg: mapped.reasonMsg,
        payload: gtrData?.encryptedPayload as string | undefined,
        remoteTransferId: gtrData?.travelruleId as string | undefined,
        protocol: 'gtr',
        latencyMs,
      };

    } catch (err) {
      const latencyMs = Date.now() - startTime;
      const isTimeout = err instanceof DOMException && err.name === 'AbortError';

      await this.insertGtrLog({
        transferId: target.vaspEntityId,
        gtrRequestId: gtrRequest.requestId,
        targetVaspCode: gtrRequest.targetVaspCode,
        verifyDirection: gtrRequest.verifyDirection,
        requestPayloadHash: await sha256Safe(request.payload),
        latencyMs,
        errorCode: isTimeout ? 'TIMEOUT' : 'CONNECTION_ERROR',
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });

      return {
        result: 'pending',
        reasonType: isTimeout ? 'CHANNEL_TIMEOUT' : 'CHANNEL_ROUTING_FAILED',
        reasonMsg: isTimeout
          ? 'GTR verification timed out (10s)'
          : `GTR connection failed: ${err instanceof Error ? err.message : 'Unknown'}`,
        protocol: 'gtr',
        latencyMs,
      };
    }
  }

  /**
   * GTR 응답 → TTR 결과 매핑
   * Guide Section 12 기반
   */
  private mapGtrToTtrResult(
    gtrResponse: Record<string, unknown>,
    verifyFields: Array<Record<string, unknown>>,
  ): { result: 'verified' | 'denied' | 'pending'; reasonType?: string; reasonMsg?: string } {
    // API 에러
    if (!gtrResponse.success) {
      return {
        result: 'pending',
        reasonType: 'GTR_SERVICE_ERROR',
        reasonMsg: (gtrResponse.verifyMessage as string) ?? 'GTR request failed',
      };
    }

    // 필드 불일치 (status=2)
    const mismatchFields = verifyFields.filter(f => f.status === 2);
    if (mismatchFields.length > 0) {
      const hasNameMismatch = mismatchFields.some(f => f.type === '110026' || f.type === '111001');
      const hasDobMismatch = mismatchFields.some(f => f.type === '110025');
      let reasonType = 'UNKNOWN';
      if (hasNameMismatch) reasonType = 'INPUT_NAME_MISMATCHED';
      else if (hasDobMismatch) reasonType = 'DOB_MISMATCHED';

      return {
        result: 'denied',
        reasonType,
        reasonMsg: `GTR PII verification mismatch: ${mismatchFields.map(f => f.type).join(', ')}`,
      };
    }

    // 필수 필드 누락 (status=4)
    const missingFields = verifyFields.filter(f => f.status === 4);
    if (missingFields.length > 0) {
      return {
        result: 'denied',
        reasonType: 'LACK_OF_INFORMATION',
        reasonMsg: `Required PII field missing: ${missingFields.map(f => f.type).join(', ')}`,
      };
    }

    // 미지원 필드 (status=3)
    const unsupportedFields = verifyFields.filter(f => f.status === 3);
    if (unsupportedFields.length > 0) {
      return {
        result: 'pending',
        reasonType: 'GTR_FIELD_NOT_SUPPORTED',
        reasonMsg: `Counterparty VASP does not support fields: ${unsupportedFields.map(f => f.type).join(', ')}`,
      };
    }

    // 모두 일치 → verified
    return { result: 'verified' };
  }

  /**
   * GTR VASP 프로필 조회
   */
  private async loadGtrProfile(vaspEntityId: string): Promise<Record<string, unknown> | null> {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

      const res = await fetch(
        `${supabaseUrl}/rest/v1/gtr_vasp_profiles?select=*&vasp_id=eq.${vaspEntityId}`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        },
      );

      // vasp_entity_id → vasp_id join이 필요하므로 vasps 먼저 조회
      const vaspRes = await fetch(
        `${supabaseUrl}/rest/v1/vasps?select=id&vasp_entity_id=eq.${vaspEntityId}`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        },
      );
      const vasps = await vaspRes.json() as Array<Record<string, unknown>>;
      if (!vasps || vasps.length === 0) return null;

      const vaspId = vasps[0].id as string;

      const profileRes = await fetch(
        `${supabaseUrl}/rest/v1/gtr_vasp_profiles?select=*&vasp_id=eq.${vaspId}&limit=1`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        },
      );
      const profiles = await profileRes.json() as Array<Record<string, unknown>>;
      return profiles?.[0] ?? null;

    } catch {
      return null;
    }
  }

  /**
   * GTR 전송 로그 삽입 (PII 미저장, 해시만)
   */
  private async insertGtrLog(log: Record<string, unknown>): Promise<void> {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

      await fetch(`${supabaseUrl}/rest/v1/gtr_transfer_logs`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          transfer_id: log.transferId,
          gtr_request_id: log.gtrRequestId,
          gtr_travelrule_id: log.gtrTravelruleId ?? null,
          target_vasp_code: log.targetVaspCode,
          verify_direction: log.verifyDirection ?? null,
          verify_status: log.verifyStatus ?? null,
          verify_message: log.verifyMessage ?? null,
          verify_fields: log.verifyFields ?? [],
          request_payload_hash: log.requestPayloadHash ?? null,
          response_payload_hash: log.responsePayloadHash ?? null,
          latency_ms: log.latencyMs ?? null,
          http_status: log.httpStatus ?? null,
          error_code: log.errorCode ?? null,
          error_message: log.errorMessage ?? null,
        }),
      });
    } catch (err) {
      console.error('[GtrAdapter] Failed to insert GTR log:', err);
    }
  }

  async sendTransferResult(
    _target: VaspTarget,
    _transferId: string,
    _txid: string,
    _vout?: string,
  ) {
    // GTR PII Verification은 Pre-transaction 전용 → TXID 보고 불필요
    // Post-transaction은 Phase 2
    return { success: true };
  }

  async sendTransferFinish(
    _target: VaspTarget,
    _transferId: string,
    _reasonType?: string,
    _reasonMsg?: string,
  ) {
    // GTR은 취소 API 없음 (One-Step 검증이므로)
    return { success: true };
  }
}

// ============================================================
// CODE VASP 헤더 빌더 (서명 생성)
// ============================================================

function buildCodeHeaders(
  privateKeyB64: string,
  vaspEntityId: string,
  body: string,
  remotePublicKeyB64?: string,
): Record<string, string> {
  const datetime = new Date().toISOString();
  const nonce = Math.floor(Math.random() * 2147483647);

  // 서명 데이터: concat(datetime_bytes, body_bytes, nonce_4bytes_bigendian)
  const datetimeBytes = new TextEncoder().encode(datetime);
  const bodyBytes = new TextEncoder().encode(body);
  const nonceBytes = new Uint8Array(4);
  nonceBytes[0] = (nonce >> 24) & 0xFF;
  nonceBytes[1] = (nonce >> 16) & 0xFF;
  nonceBytes[2] = (nonce >> 8) & 0xFF;
  nonceBytes[3] = nonce & 0xFF;

  const data = new Uint8Array(datetimeBytes.length + bodyBytes.length + nonceBytes.length);
  data.set(datetimeBytes, 0);
  data.set(bodyBytes, datetimeBytes.length);
  data.set(nonceBytes, datetimeBytes.length + bodyBytes.length);

  // Ed25519 서명 — Deno 환경에서는 tweetnacl을 직접 import 할 수 없으므로
  // SubtleCrypto 또는 인라인 구현 사용
  // 여기서는 서명을 placeholder로 두고, 실제 배포 시 시크릿에서 주입
  const publicKeyB64 = extractPublicKey(privateKeyB64);

  const headers: Record<string, string> = {
    'X-Code-Req-Datetime': datetime,
    'X-Code-Req-Nonce': nonce.toString(),
    'X-Code-Req-PubKey': publicKeyB64,
    'X-Code-Req-Signature': '', // TODO: 실제 서명 (tweetnacl import 후 구현)
    'X-Request-Origin': `transight:${vaspEntityId}`,
  };

  if (remotePublicKeyB64) {
    headers['X-Code-Req-Remote-PubKey'] = remotePublicKeyB64;
  }

  return headers;
}

/** Base64 Ed25519 secret key (64B) → public key (32B) 추출 */
function extractPublicKey(b64PrivateKey: string): string {
  try {
    const raw = atob(b64PrivateKey);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    // Ed25519 secret key의 마지막 32바이트가 public key
    const pubBytes = bytes.slice(32, 64);
    return btoa(String.fromCharCode(...pubBytes));
  } catch {
    return b64PrivateKey; // fallback
  }
}

// ============================================================
// Adapter Registry & Router
// ============================================================

const adapters: Record<string, ProtocolAdapter> = {
  code: new CodeVaspAdapter(),
  sumsub: new SumsubAdapter(),
  verifyvasp: new VerifyVaspAdapter(),
  transight: new TransightInternalAdapter(),
  direct: new DirectAdapter(),
  gtr: new GtrAdapter(),
};

/**
 * alliance_name에 따라 적절한 어댑터를 반환
 */
export function getAdapter(allianceName: string): ProtocolAdapter {
  return adapters[allianceName] || adapters['direct'];
}

/**
 * 수신 VASP 정보를 기반으로 TR 메시지를 라우팅
 * 
 * @param target 수신 VASP 정보
 * @param request TR 인가 요청
 * @param hubPrivateKey Hub Ed25519 private key
 * @param hubVaspEntityId Hub VASP entity ID
 * @returns 어댑터 응답
 */
export async function routeTransfer(
  target: VaspTarget,
  request: AdapterTransferRequest,
  hubPrivateKey: string,
  hubVaspEntityId: string,
): Promise<AdapterTransferResponse> {
  const adapter = getAdapter(target.allianceName);

  console.log(`[ProtocolAdapter] Routing transfer ${request.transferId} via ${adapter.name} to ${target.vaspEntityId}`);

  const response = await adapter.sendTransferAuth(
    target,
    request,
    hubPrivateKey,
    hubVaspEntityId,
  );

  console.log(`[ProtocolAdapter] ${adapter.name} response: ${response.result} (${response.latencyMs}ms)`);

  return response;
}

/**
 * TXID 결과를 수신 VASP에 전달
 */
export async function routeTransferResult(
  target: VaspTarget,
  transferId: string,
  txid: string,
  vout?: string,
): Promise<{ success: boolean; error?: string }> {
  const adapter = getAdapter(target.allianceName);
  return adapter.sendTransferResult(target, transferId, txid, vout);
}

/**
 * 전송 취소를 수신 VASP에 전달
 */
export async function routeTransferFinish(
  target: VaspTarget,
  transferId: string,
  reasonType?: string,
  reasonMsg?: string,
): Promise<{ success: boolean; error?: string }> {
  const adapter = getAdapter(target.allianceName);
  return adapter.sendTransferFinish(target, transferId, reasonType, reasonMsg);
}

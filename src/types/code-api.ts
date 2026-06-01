/**
 * CODE VASP API 요청/응답 타입 정의
 * @see reference/codevasp-skills/skills/codevasp-core/references/api/
 */

// ============================================================
// HTTP Header Types
// ============================================================

/** CODE VASP 필수 요청 헤더 */
export interface CodeVaspRequestHeaders {
  /** ISO8601 UTC datetime (e.g., "2024-03-04T15:10Z") */
  'X-Code-Req-Datetime': string;
  /** 랜덤 논스 (100초 이내 중복 불가) */
  'X-Code-Req-Nonce': string;
  /** 자신의 Ed25519 공개키 (Base64) */
  'X-Code-Req-PubKey': string;
  /** 수신 VASP 공개키 (Base64, 암호화 API에서만 필수) */
  'X-Code-Req-Remote-PubKey'?: string;
  /** Ed25519 서명 (Base64) */
  'X-Code-Req-Signature': string;
  /** 솔루션명:엔티티ID (e.g., "code:coinone") */
  'X-Request-Origin': string;
}

// ============================================================
// VASP Discovery API
// ============================================================

/** VASP 공개키 정보 */
export interface VaspPubkey {
  pubkey: string;       // Base64 Ed25519 verify key
  expiresAt: string;    // ISO8601 UTC
}

/** VASP 정보 (VASP List Search 응답) */
export interface VaspInfo {
  health: 'up' | 'down';
  vaspEntityId: string;
  vaspName: string;
  vaspLegalName: string;
  countryOfRegistration: string;
  allianceName: string;
  pubkeys: VaspPubkey[];
}

/** GET /v1/code/vasps 응답 */
export interface VaspListResponse {
  vasps: VaspInfo[];
}

/** GET /v1/code/pubkey/{vaspEntityId} 응답 */
export interface PublicKeySearchResponse {
  pubkeys: VaspPubkey[];
}

// ============================================================
// Wallet Search API
// ============================================================

/** POST /v1/code/address/search 요청 */
export interface SearchVaspByWalletRequest {
  currency: string;
  address: string;
  tag?: string;
  network?: string;
}

/** Search VASP by Wallet 결과 */
export interface SearchVaspByWalletResult {
  vaspEntityId: string;
  vaspName: string;
  allianceName: string;
}

// ============================================================
// Virtual Asset Address Search API
// ============================================================

/** POST /v1/code/address/verify/{vaspEntityId} 요청 */
export interface VirtualAssetAddressSearchRequest {
  currency: string;
  address: string;
  tag?: string;
  network?: string;
  payload: string; // 암호화된 IVMS101 (Beneficiary 이름만)
}

/** Virtual Asset Address Search 응답 */
export interface VirtualAssetAddressSearchResponse {
  result: 'verified' | 'denied';
  reasonType?: string;
  reasonMsg?: string;
}

// ============================================================
// Asset Transfer Authorization API (핵심)
// ============================================================

/** POST /v1/code/transfer/{BeneficiaryVaspEntityId} 요청 */
export interface AssetTransferAuthRequest {
  /** UUID v4 — 고유 전송 추적 ID */
  transferId: string;
  /** 가상자산 심볼 (case insensitive, e.g., "BTC") */
  currency: string;
  /** 전송 수량 (수수료 제외 실제 전송량) */
  amount: string;
  /** 취득가액 (국세청 요구, 현재 미사용) */
  historicalCost?: string;
  /** 법정화폐 환산 금액 (수량 × 가격) */
  tradePrice: string;
  /** 법정화폐 코드 (ISO 4217: KRW, USD, EUR, ...) */
  tradeCurrency: string;
  /** 트래블룰 임계값 초과 여부 */
  isExceedingThreshold: boolean | string;
  /** OriginatingVASP 정보 (payload 내 값 덮어쓰기) */
  originatingVasp?: Record<string, unknown>;
  /** 암호화된 IVMS101 payload (Base64 string) */
  payload: string;
  /** 수신인 지갑 주소 (상호운용성) */
  address?: string;
  /** Tag/Memo (XRP 등) */
  tag?: string;
  /** 네트워크 이름 (멀티네트워크 코인) */
  network?: string;
}

/** Asset Transfer Authorization 응답 */
export interface AssetTransferAuthResponse {
  /** 인가 결과 */
  result: 'verified' | 'denied';
  /** 거부 사유 타입 */
  reasonType?: TransferDenialReason;
  /** 거부 사유 메시지 */
  reasonMsg?: string;
  /** 전송 추적 ID */
  transferId: string;
  /** 수신 VASP 정보 */
  beneficiaryVasp?: Record<string, unknown>;
  /** 암호화된 IVMS101 응답 payload */
  payload?: string;
}

/** 전송 거부 사유 */
export type TransferDenialReason =
  | 'NOT_FOUND_ADDRESS'       // 지갑 주소 없음
  | 'NOT_SUPPORTED_SYMBOL'    // 지원하지 않는 코인
  | 'NOT_KYC_USER'            // KYC 미완료 사용자
  | 'INPUT_NAME_MISMATCHED'   // 수신인 이름 불일치
  | 'DOB_MISMATCHED'          // 생년월일 불일치
  | 'SANCTION_LIST'           // 제재 대상
  | 'LACK_OF_INFORMATION'     // 정보 부족
  | 'UNKNOWN';                // 기타

// ============================================================
// Report Transfer Result API
// ============================================================

/** POST /v1/code/transfer/result/{BeneficiaryVaspEntityId} 요청 */
export interface ReportTransferResultRequest {
  transferId: string;
  txid: string;    // 온체인 TX Hash
  vout?: string;   // UTXO 기반 체인의 vout index
}

/** Report Transfer Result 응답 */
export interface ReportTransferResultResponse {
  result: 'success' | 'fail';
  reasonMsg?: string;
}

// ============================================================
// Transaction Status Search API
// ============================================================

/** GET /v1/code/transfer/status/{transferId} 응답 */
export interface TransactionStatusResponse {
  transferId: string;
  status: string;
  txid?: string;
}

// ============================================================
// Finish Transfer API
// ============================================================

/** POST /v1/code/transfer/finish/{transferId} 요청 */
export interface FinishTransferRequest {
  transferId: string;
  result: 'canceled';
  reasonType?: string;
  reasonMsg?: string;
}

// ============================================================
// Health Check API
// ============================================================

/** GET /v1/code/health 응답 */
export interface HealthCheckResponse {
  status: 'up' | 'down';
  timestamp: string;
}

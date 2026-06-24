/**
 * GTR (Global Travel Rule) API 타입 정의
 * TTR_GTR_Adapter_Implementation_Guide 기반
 * 
 * GTR One-Step PII Verification API 요청/응답 모델
 */

// ============================================================
// GTR Verify Field Codes
// ============================================================

/** GTR PII 검증 필드 코드 */
export const GTR_VERIFY_FIELDS = {
  // Natural Person
  BENEFICIARY_NAME: '110026',
  BENEFICIARY_DOB: '110025',
  // Legal Person
  BENEFICIARY_LEGAL_NAME: '111001',
  BENEFICIARY_LEGAL_COUNTRY: '111022',
} as const;

/** 기본 자연인 검증 필드 (이름 + 생년월일) */
export const DEFAULT_NATURAL_PERSON_FIELDS: string[] = [
  GTR_VERIFY_FIELDS.BENEFICIARY_NAME,
  GTR_VERIFY_FIELDS.BENEFICIARY_DOB,
];

/** 기본 법인 검증 필드 (법인명 + 등록 국가) */
export const DEFAULT_LEGAL_PERSON_FIELDS: string[] = [
  GTR_VERIFY_FIELDS.BENEFICIARY_LEGAL_NAME,
  GTR_VERIFY_FIELDS.BENEFICIARY_LEGAL_COUNTRY,
];

// ============================================================
// GTR Verify Field Status Codes
// ============================================================

/** GTR 필드 검증 상태 코드 */
export const GTR_FIELD_STATUS = {
  MATCHED: 1,
  MISMATCHED: 2,
  NOT_SUPPORTED: 3,
  REQUIRED_MISSING: 4,
} as const;

// ============================================================
// GTR Adapter Options (클라이언트 요청 시 선택적 전달)
// ============================================================

/** 
 * /transfer-auth 요청의 adapterOptions.gtr 
 * 클라이언트(금융기관)가 GTR 관련 파라미터를 커스텀할 때 사용
 */
export interface GtrAdapterOptions {
  /** 검증 모드 (Phase 1: PII_VERIFICATION만 지원) */
  mode?: 'PII_VERIFICATION' | 'REENCRYPT_TO_GTR';
  /** GTR verify direction (2=Pre-transaction, 1=Post-transaction) */
  verifyDirection?: number;
  /** GTR VASP 코드 (없으면 gtr_vasp_profiles에서 조회) */
  targetVaspCode?: string;
  /** 송신자/TTR Curve25519 공개키 (없으면 환경변수) */
  initiatorPublicKey?: string;
  /** 수신 VASP Curve25519 공개키 (없으면 gtr_vasp_profiles) */
  targetVaspPublicKey?: string;
  /** 검증할 PII 필드 코드 목록 (없으면 기본값 사용) */
  expectVerifyFields?: string[];
  /** payload 포맷 표시 */
  payloadFormat?: 'GTR_CURVE25519_ENCRYPTED';
  /** 법정 기준금액 초과 여부 사용 */
  lawThresholdEnabled?: boolean;
  /** GTR piiSecuredInfo (선택) */
  piiSecuredInfo?: Record<string, unknown>;
}

// ============================================================
// GTR One-Step Request
// ============================================================

/** GTR /api/verify/v2/one_step 요청 */
export interface GtrOneStepRequest {
  /** 요청 ID: TTR-{transferId} */
  requestId: string;
  /** 가상자산 ticker (BTC, ETH, USDT...) */
  ticker: string;
  /** 전송 수량 */
  amount: string;
  /** 수신 지갑 주소 */
  address: string;
  /** Tag/Memo (XRP, XLM, TON 등) */
  tag?: string;
  /** 블록체인 네트워크 */
  network?: string;
  /** 온체인 TX ID (post-transaction에서 사용) */
  txId?: string | null;
  /** 검증 방향 (2=Pre-transaction, 1=Post-transaction) */
  verifyDirection: number;
  /** GTR 대상 VASP 코드 */
  targetVaspCode: string;
  /** 암호화된 IVMS101 payload (Curve25519) */
  encryptedPayload: string;
  /** 송신측 Curve25519 공개키 */
  initiatorPublicKey: string;
  /** 수신측 Curve25519 공개키 */
  targetVaspPublicKey: string;
  /** 법정 화폐 코드 (KRW, USD...) */
  fiatName?: string;
  /** 법정 화폐 환산 금액 */
  fiatPrice?: string | null;
  /** 법정 기준금액 초과 여부 */
  lawThresholdEnabled?: boolean;
  /** 검증 요청 필드 목록 (예: ['110026', '110025']) */
  expectVerifyFields: string[];
  /** PII 보안 정보 (선택) */
  piiSecuredInfo?: Record<string, unknown>;
}

// ============================================================
// GTR One-Step Response
// ============================================================

/** GTR 필드별 검증 결과 */
export interface GtrVerifyField {
  /** 필드 코드 (예: '110026') */
  type: string;
  /** 검증 상태 (1=일치, 2=불일치, 3=미지원, 4=필수누락) */
  status: number;
  /** 결과 메시지 */
  message?: string;
}

/** GTR /api/verify/v2/one_step 응답 */
export interface GtrOneStepResponse {
  /** 요청 성공 여부 */
  success: boolean;
  /** 검증 상태 코드 (100000=성공) */
  verifyStatus?: number;
  /** 검증 결과 메시지 */
  verifyMessage?: string;
  /** 응답 데이터 */
  data?: {
    /** GTR 발급 travelrule ID */
    travelruleId?: string;
    /** 필드별 검증 결과 */
    verifyFields?: GtrVerifyField[];
    /** 암호화된 응답 payload */
    encryptedPayload?: string;
  };
  /** 에러 코드 */
  errorCode?: string;
  /** 에러 메시지 */
  errorMessage?: string;
}

// ============================================================
// GTR VASP Profile (DB 행 매핑)
// ============================================================

/** gtr_vasp_profiles 테이블 레코드 */
export interface GtrVaspProfile {
  id: string;
  vasp_id: string;
  gtr_vasp_code: string;
  gtr_legal_entity_name?: string;
  gtr_display_name?: string;
  jurisdiction?: string;
  target_public_key?: string;
  target_public_key_algorithm: string;
  target_public_key_expires_at?: string;
  support_pre_transaction: boolean;
  support_post_transaction: boolean;
  pii_verification_support: string[];
  expected_pii_preferences: string[];
  address_verification_supported: boolean;
  txid_verification_supported: boolean;
  status: 'active' | 'pending' | 'disabled';
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

/** gtr_transfer_logs 테이블 레코드 */
export interface GtrTransferLog {
  id: string;
  transfer_id: string;
  gtr_request_id: string;
  gtr_travelrule_id?: string;
  target_vasp_code: string;
  verify_direction?: number;
  verify_status?: number;
  verify_message?: string;
  verify_fields: GtrVerifyField[];
  request_payload_hash?: string;
  response_payload_hash?: string;
  latency_ms?: number;
  http_status?: number;
  error_code?: string;
  error_message?: string;
  created_at: string;
}

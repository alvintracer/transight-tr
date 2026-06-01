/**
 * Transfer 상태 머신 타입 정의
 * CODE VASP Asset-Transfer-Status-Management 기반
 * @see reference/codevasp-skills/skills/codevasp-core/references/guides/02-Development/09-Asset-Transfer-Status-Management.md
 */

// ============================================================
// Transfer Status Enum
// ============================================================

/** Transfer 상태 (CODE VASP 호환 8단계) */
export enum TransferStatus {
  /** 수신 VASP 응답 대기 중 */
  WAIT = 'wait',
  /** 수신 VASP가 인가함 (아직 블록체인 미전송) */
  VERIFIED = 'verified',
  /** 수신 VASP가 거부함 */
  DENIED = 'denied',
  /** 블록체인 전송 전 대기 */
  PENDING = 'pending',
  /** 블록체인 전송됨, 마이닝 대기 */
  PROCESSING = 'processing',
  /** 마이닝됨, finality 미확보 */
  WAIT_CONFIRMED = 'wait-confirmed',
  /** 블록체인 전송 완료 (TXID 업데이트) */
  CONFIRMED = 'confirmed',
  /** 전송 취소 (블록체인 미실행) */
  CANCELED = 'canceled',
}

/** 전송 방향 */
export enum TransferDirection {
  /** 출금 (Originator 측) */
  OUTGOING = 'outgoing',
  /** 입금 (Beneficiary 측) */
  INCOMING = 'incoming',
}

// ============================================================
// Status Transition Rules
// ============================================================

/**
 * 허용되는 상태 전이 맵
 * Originator VASP 관점 기준
 */
export const VALID_STATUS_TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
  [TransferStatus.WAIT]: [
    TransferStatus.VERIFIED,
    TransferStatus.DENIED,
  ],
  [TransferStatus.VERIFIED]: [
    TransferStatus.PENDING,
    TransferStatus.CANCELED,
  ],
  [TransferStatus.DENIED]: [],  // 최종 상태
  [TransferStatus.PENDING]: [
    TransferStatus.PROCESSING,
    TransferStatus.CANCELED,
  ],
  [TransferStatus.PROCESSING]: [
    TransferStatus.WAIT_CONFIRMED,
    TransferStatus.CANCELED,
  ],
  [TransferStatus.WAIT_CONFIRMED]: [
    TransferStatus.CONFIRMED,
    TransferStatus.CANCELED,  // 낮은 확률
  ],
  [TransferStatus.CONFIRMED]: [
    TransferStatus.CANCELED,  // 매우 낮은 확률 (재조직 등)
  ],
  [TransferStatus.CANCELED]: [],  // 최종 상태
};

/** 최종 상태 (더 이상 전이 불가) */
export const TERMINAL_STATUSES: TransferStatus[] = [
  TransferStatus.DENIED,
  TransferStatus.CANCELED,
];

/**
 * 상태 전이 검증
 * @param current 현재 상태
 * @param next 전이할 상태
 * @returns 전이 가능 여부
 */
export function isValidTransition(
  current: TransferStatus,
  next: TransferStatus
): boolean {
  return VALID_STATUS_TRANSITIONS[current]?.includes(next) ?? false;
}

// ============================================================
// Transfer Record
// ============================================================

/** Transfer 레코드 (DB 행 매핑) */
export interface TransferRecord {
  id: string;                          // UUID
  transfer_id: string;                 // CODE transferId (UUID v4)
  status: TransferStatus;
  direction: TransferDirection;
  originator_vasp_id?: string;         // FK → vasps.id
  beneficiary_vasp_id?: string;        // FK → vasps.id
  currency: string;
  amount: string;
  trade_price?: string;
  trade_currency?: string;
  is_exceeding_threshold: boolean;
  payload_encrypted?: string;          // Base64 암호화 IVMS101
  ivms101_metadata?: Record<string, unknown>; // Hub 접근 가능 메타데이터
  result?: 'verified' | 'denied';
  reason_type?: string;
  reason_msg?: string;
  txid?: string;                       // 온체인 TX Hash
  kyt_result?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

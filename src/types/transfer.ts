/**
 * Transfer status machine types.
 */

export enum TransferStatus {
  WAIT = 'wait',
  VERIFIED = 'verified',
  DENIED = 'denied',
  PENDING = 'pending',
  PROCESSING = 'processing',
  WAIT_CONFIRMED = 'wait-confirmed',
  CONFIRMED = 'confirmed',
  CANCELED = 'canceled',
}

export enum TransferDirection {
  OUTGOING = 'outgoing',
  INCOMING = 'incoming',
}

export const VALID_STATUS_TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
  [TransferStatus.WAIT]: [
    TransferStatus.VERIFIED,
    TransferStatus.DENIED,
    TransferStatus.PENDING,
  ],
  [TransferStatus.VERIFIED]: [
    TransferStatus.PENDING,
    TransferStatus.CONFIRMED,
    TransferStatus.CANCELED,
  ],
  [TransferStatus.DENIED]: [],
  [TransferStatus.PENDING]: [
    TransferStatus.VERIFIED,
    TransferStatus.DENIED,
    TransferStatus.PROCESSING,
    TransferStatus.CANCELED,
  ],
  [TransferStatus.PROCESSING]: [
    TransferStatus.WAIT_CONFIRMED,
    TransferStatus.CANCELED,
  ],
  [TransferStatus.WAIT_CONFIRMED]: [
    TransferStatus.CONFIRMED,
    TransferStatus.CANCELED,
  ],
  [TransferStatus.CONFIRMED]: [],
  [TransferStatus.CANCELED]: [],
};

export const TERMINAL_STATUSES: TransferStatus[] = [
  TransferStatus.DENIED,
  TransferStatus.CONFIRMED,
  TransferStatus.CANCELED,
];

export function isValidTransition(current: TransferStatus, next: TransferStatus): boolean {
  return VALID_STATUS_TRANSITIONS[current]?.includes(next) ?? false;
}

export interface TransferRecord {
  id: string;
  transfer_id: string;
  status: TransferStatus;
  direction: TransferDirection;
  originator_vasp_id?: string | null;
  beneficiary_vasp_id?: string | null;
  currency: string;
  amount: string;
  trade_price?: string | null;
  trade_currency?: string | null;
  is_exceeding_threshold: boolean;
  payload_encrypted?: string | null;
  ivms101_metadata?: Record<string, unknown>;
  result?: 'verified' | 'denied' | 'pending' | null;
  reason_type?: string | null;
  reason_msg?: string | null;
  txid?: string | null;
  vout?: string | null;
  kyt_result?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

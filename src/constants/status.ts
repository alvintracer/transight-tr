/**
 * Transfer 상태 상수 (재내보내기)
 * 
 * @see src/types/transfer.ts 에서 상세 상태 머신 정의
 */

export {
  TransferStatus,
  TransferDirection,
  VALID_STATUS_TRANSITIONS,
  TERMINAL_STATUSES,
  isValidTransition,
} from '../types/transfer.js';

/**
 * CodeVASP-compatible API types plus Bonanza TTR extensions.
 *
 * Source baseline:
 * - CodeVASP public key registry stores Base64 Ed25519 verify keys.
 * - Request signatures use Ed25519.
 * - Payload encryption derives X25519/Curve25519 keys from the Ed25519 keys.
 */

// ============================================================
// HTTP Header Types
// ============================================================

export interface CodeVaspRequestHeaders {
  /** ISO8601 UTC datetime, e.g. "2024-03-04T15:10Z" */
  'X-Code-Req-Datetime': string;
  /** Random nonce. Reuse should be rejected by the receiver. */
  'X-Code-Req-Nonce': string;
  /** Sender Ed25519 verify key, Base64. */
  'X-Code-Req-PubKey': string;
  /** Receiver Ed25519 verify key, Base64. Required for encrypted APIs. */
  'X-Code-Req-Remote-PubKey'?: string;
  /** Ed25519 detached signature, Base64. */
  'X-Code-Req-Signature': string;
  /** Network namespace and VASP id, e.g. "bonanza:kakaopay". */
  'X-Request-Origin': string;
}

// ============================================================
// VASP Discovery API
// ============================================================

export type PublicKeyPurpose = 'signing' | 'encryption' | 'both';

export interface VaspPubkey {
  /** Base64 Ed25519 verify key. */
  pubkey: string;
  /** Alias for SDKs that prefer camelCase field names. */
  publicKey?: string;
  algorithm: 'Ed25519';
  keyPurpose: PublicKeyPurpose;
  encryptionDerivation: 'ed25519_to_x25519';
  encryptionSuite: 'X25519-XSalsa20-Poly1305';
  kid?: string | null;
  version?: number;
  expiresAt?: string | null;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface VaspInfo {
  health: 'up' | 'down';
  vaspEntityId: string;
  vaspName: string;
  vaspLegalName?: string | null;
  countryOfRegistration?: string | null;
  allianceName: string;
  channelType?: 'HTTPS' | 'mTLS' | 'VPN' | 'LEASED_LINE' | string;
  endpointUrl?: string | null;
  metadata?: Record<string, unknown>;
  pubkeys: VaspPubkey[];
}

export interface VaspListResponse {
  vasps: VaspInfo[];
  total?: number;
}

/** GET /vasp-registry/pubkey/{vaspEntityId} */
export interface PublicKeySearchResponse {
  vaspEntityId: string;
  vaspName?: string;
  allianceName?: string;
  health?: 'up' | 'down' | string;
  keys: VaspPubkey[];
}

// ============================================================
// Wallet Search API
// ============================================================

export interface SearchVaspByWalletRequest {
  currency: string;
  address: string;
  tag?: string;
  network?: string;
}

export interface SearchVaspByWalletResult {
  vaspEntityId: string;
  vaspName: string;
  allianceName: string;
}

// ============================================================
// Address Verification Compatibility
// ============================================================

/**
 * Legacy CodeVASP-compatible address verification shape.
 * In Bonanza TTR this should be replaced by OwnerCheck for same-owner checks.
 */
export interface VirtualAssetAddressSearchRequest {
  currency: string;
  address: string;
  tag?: string;
  network?: string;
  payload: string;
}

export interface VirtualAssetAddressSearchResponse {
  result: 'verified' | 'denied' | 'pending';
  reasonType?: TransferDenialReason;
  reasonMsg?: string;
}

// ============================================================
// Asset Transfer Authorization API
// ============================================================

export interface AssetTransferAuthRequest {
  transferId: string;
  currency: string;
  amount: string;
  historicalCost?: string;
  tradePrice?: string;
  tradeCurrency?: string;
  isExceedingThreshold?: boolean | string;
  originatingVasp?: Record<string, unknown>;
  payload: string;
  address?: string;
  tag?: string;
  network?: string;
  originatorVaspEntityId?: string;
  beneficiaryVaspEntityId: string;
  adapterOptions?: Record<string, unknown>;
}

export interface AssetTransferAuthResponse {
  result: 'verified' | 'denied' | 'pending';
  reasonType?: TransferDenialReason | string;
  reasonMsg?: string;
  transferId: string;
  beneficiaryVasp?: {
    vaspEntityId: string;
    vaspName: string;
  };
  payload?: unknown;
  kyt?: {
    decision?: string;
    riskScore?: number;
  };
  adapter?: {
    protocol: string;
    latencyMs: number;
  };
}

export type TransferDenialReason =
  | 'NOT_FOUND_ADDRESS'
  | 'NOT_SUPPORTED_SYMBOL'
  | 'NOT_KYC_USER'
  | 'INPUT_NAME_MISMATCHED'
  | 'DOB_MISMATCHED'
  | 'SANCTION_LIST'
  | 'LACK_OF_INFORMATION'
  | 'KYT_BLOCK'
  | 'VASP_NOT_FOUND'
  | 'VASP_KEY_NOT_FOUND'
  | 'VASP_HEALTH_DOWN'
  | 'RELAY_ERROR'
  | 'UNKNOWN';

// ============================================================
// OwnerCheck API
// ============================================================

export interface OwnerCheckPolicy {
  requireDobMatch?: boolean;
  nameMatchingPolicy?: 'codevasp-default' | 'strict' | 'local';
  dobFormat?: 'YYYY-MM-DD' | 'YYYYMMDD' | 'provider-specific';
  [key: string]: unknown;
}

export interface OwnerCheckRequest {
  ownerCheckId: string;
  currency: string;
  address: string;
  tag?: string;
  network?: string;
  /** Encrypted or hashed same-owner verification payload. */
  payload: string;
  originatorVaspEntityId?: string;
  beneficiaryVaspEntityId: string;
  policy?: OwnerCheckPolicy;
}

export interface OwnerCheckResponse {
  ownerCheckId: string;
  result: 'verified' | 'denied' | 'pending';
  reasonType?: TransferDenialReason | string;
  reasonMsg?: string;
  beneficiaryVasp?: {
    vaspEntityId: string;
    vaspName: string;
  };
  payload?: unknown;
  adapter?: {
    protocol: string;
    latencyMs: number;
  };
}

export interface OwnerCheckStatusResponse {
  ownerCheckId: string;
  status: 'pending' | 'verified' | 'denied' | 'error' | 'canceled';
  currency: string;
  address: string;
  tag?: string | null;
  network?: string | null;
  result?: 'verified' | 'denied' | 'pending';
  reasonType?: string | null;
  reasonMsg?: string | null;
  policy?: OwnerCheckPolicy;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Transfer Result / Status APIs
// ============================================================

export interface ReportTransferResultRequest {
  transferId: string;
  txid: string;
  vout?: string;
}

export interface ReportTransferResultResponse {
  result: 'success' | 'fail';
  reasonMsg?: string;
}

export interface TransactionStatusResponse {
  transferId: string;
  status: string;
  txid?: string;
}

export interface FinishTransferRequest {
  transferId: string;
  result?: 'canceled';
  reasonType?: string;
  reasonMsg?: string;
}

export interface HealthCheckResponse {
  status: 'up' | 'down';
  timestamp: string;
}

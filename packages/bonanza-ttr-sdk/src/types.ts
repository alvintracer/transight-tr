export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = Record<string, JsonValue | unknown>;

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export type PublicKeyPurpose = 'signing' | 'encryption' | 'both';

export interface BonanzaTtrClientOptions {
  baseUrl: string;
  apiKey?: string;
  allianceName?: string;
  vaspEntityId?: string;
  signingPrivateKey?: string;
  signingPublicKey?: string;
  defaultRemotePublicKey?: string;
  fetch?: FetchLike;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  sign?: boolean;
  remotePublicKey?: string;
}

export interface VaspPubkey {
  pubkey: string;
  publicKey?: string;
  algorithm: 'Ed25519' | string;
  keyPurpose: PublicKeyPurpose;
  encryptionDerivation?: 'ed25519_to_x25519' | string;
  encryptionSuite?: 'X25519-XSalsa20-Poly1305' | string;
  kid?: string | null;
  version?: number;
  expiresAt?: string | null;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface PublicKeySearchResponse {
  vaspEntityId: string;
  vaspName?: string;
  allianceName?: string;
  health?: string;
  keys: VaspPubkey[];
}

export interface VaspInfo {
  health: string;
  vaspEntityId: string;
  vaspName: string;
  vaspLegalName?: string | null;
  countryOfRegistration?: string | null;
  allianceName: string;
  channelType?: string;
  endpointUrl?: string | null;
  metadata?: Record<string, unknown>;
  pubkeys?: VaspPubkey[];
  publicKeys?: VaspPubkey[];
}

export interface VaspListResponse {
  vasps: VaspInfo[];
  total?: number;
}

export interface VaspRegistrationInput {
  vasp_entity_id: string;
  vasp_name: string;
  vasp_legal_name?: string;
  country_of_registration?: string;
  alliance_name?: string;
  endpoint_url: string;
  channel_type?: string;
  public_key: string;
  public_key_expires_at?: string | null;
  key_purpose?: PublicKeyPurpose;
  kid?: string;
  metadata?: Record<string, unknown>;
}

export interface TransferAuthRequest {
  transferId: string;
  currency: string;
  amount: string;
  historicalCost?: string;
  tradePrice?: string;
  tradeCurrency?: string;
  isExceedingThreshold?: boolean | string;
  address?: string;
  tag?: string;
  network?: string;
  originatorVaspEntityId?: string;
  beneficiaryVaspEntityId: string;
  payload: string;
  adapterOptions?: Record<string, unknown>;
}

export interface TransferAuthResponse {
  result: 'verified' | 'denied' | 'pending' | string;
  transferId: string;
  reasonType?: string;
  reasonMsg?: string;
  beneficiaryVasp?: {
    vaspEntityId: string;
    vaspName: string;
  };
  kyt?: Record<string, unknown>;
  adapter?: Record<string, unknown>;
}

export interface TransferStatusResponse {
  transferId: string;
  status: string;
  direction?: string;
  result?: string | null;
  reasonType?: string | null;
  reasonMsg?: string | null;
  txid?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ReportTransferResultRequest {
  transferId: string;
  txid: string;
  vout?: string;
}

export interface OwnerCheckPolicy {
  requireDobMatch?: boolean;
  nameMatchingPolicy?: 'normalized-exact' | 'strict' | 'local' | string;
  dobFormat?: 'YYYY-MM-DD' | 'YYYYMMDD' | 'provider-specific' | string;
  [key: string]: unknown;
}

export interface OwnerCheckRequest {
  ownerCheckId?: string;
  currency: string;
  address: string;
  tag?: string | null;
  network?: string;
  payload: string;
  payloadFormat?: string;
  originatorVaspEntityId?: string;
  beneficiaryVaspEntityId: string;
  policy?: OwnerCheckPolicy;
}

export interface OwnerCheckResponse {
  ownerCheckId: string;
  status?: string;
  result?: 'verified' | 'denied' | 'pending' | string;
  reasonType?: string | null;
  reasonMsg?: string | null;
  beneficiaryVaspEntityId?: string;
  routed?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface HealthCheckResponse {
  status: 'up' | 'down' | string;
  timestamp?: string;
  service?: string;
  version?: string;
  components?: Record<string, unknown>;
}

export interface BonanzaTtrConfigFile {
  baseUrl: string;
  vaspEntityId: string;
  allianceName?: string;
  apiKeyEnv?: string;
  signingPrivateKeyEnv?: string;
  signingPublicKeyEnv?: string;
}

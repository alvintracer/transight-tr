/**
 * VASP registry domain types.
 */

export enum ChannelType {
  HTTPS = 'HTTPS',
  MTLS = 'mTLS',
  VPN = 'VPN',
  LEASED_LINE = 'LEASED_LINE',
}

export enum AllianceName {
  BONANZA = 'bonanza',
  CODE = 'code',
  CODE_COMPATIBLE = 'code-compatible',
  TRANSIGHT = 'transight',
  DIRECT = 'direct',
  VERIFY_VASP = 'verifyvasp',
  SUMSUB = 'sumsub',
  GTR = 'gtr',
}

export type PublicKeyPurpose = 'signing' | 'encryption' | 'both';

export interface VaspRecord {
  id: string;
  vasp_entity_id: string;
  vasp_name: string;
  vasp_legal_name?: string | null;
  country_of_registration?: string | null;
  alliance_name: AllianceName | string;
  endpoint_url?: string | null;
  channel_type: ChannelType | string;
  health: 'up' | 'down';
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PublicKeyRecord {
  id: string;
  vasp_id: string;
  /** Base64 Ed25519 verify key. */
  public_key: string;
  algorithm: 'Ed25519' | string;
  key_purpose: PublicKeyPurpose;
  kid?: string | null;
  version?: number;
  metadata?: Record<string, unknown>;
  expires_at?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface VaspRegistrationInput {
  vasp_entity_id: string;
  vasp_name: string;
  vasp_legal_name?: string;
  country_of_registration: string;
  alliance_name?: AllianceName | string;
  endpoint_url: string;
  channel_type?: ChannelType | string;
  public_key: string;
  public_key_expires_at?: string;
  key_purpose?: PublicKeyPurpose;
  kid?: string;
  metadata?: Record<string, unknown>;
}

export interface VaspSearchFilter {
  alliance_name?: AllianceName | string;
  country?: string;
  health?: 'up' | 'down';
  search?: string;
}

export interface VaspWithKeys extends VaspRecord {
  public_keys: PublicKeyRecord[];
}

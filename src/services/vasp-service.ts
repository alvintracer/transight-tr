/**
 * VASP 서비스 레이어
 * Supabase DB CRUD 오퍼레이션 + CODE VASP 호환 변환
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VaspRecord, PublicKeyRecord, VaspRegistrationInput, VaspSearchFilter, VaspWithKeys } from '../types/vasp.js';
import type { VaspInfo, VaspListResponse } from '../types/code-api.js';

// ============================================================
// Client Factory
// ============================================================

function getServiceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ============================================================
// VASP CRUD
// ============================================================

/**
 * VASP 등록
 */
export async function registerVasp(input: VaspRegistrationInput): Promise<VaspRecord> {
  const supabase = getServiceClient();

  // 1. VASP 레코드 생성
  const { data: vasp, error: vaspError } = await supabase
    .from('vasps')
    .insert({
      vasp_entity_id: input.vasp_entity_id,
      vasp_name: input.vasp_name,
      vasp_legal_name: input.vasp_legal_name,
      country_of_registration: input.country_of_registration,
      alliance_name: input.alliance_name ?? 'bonanza',
      endpoint_url: input.endpoint_url,
      channel_type: input.channel_type ?? 'HTTPS',
    })
    .select()
    .single();

  if (vaspError) throw new Error(`VASP registration failed: ${vaspError.message}`);

  // 2. 공개키 등록
  const { error: keyError } = await supabase
    .from('public_keys')
    .insert({
      vasp_id: vasp.id,
      public_key: input.public_key,
      algorithm: 'Ed25519',
      key_purpose: input.key_purpose ?? 'both',
      kid: input.kid ?? null,
      metadata: {
        encryptionDerivation: 'ed25519_to_x25519',
        encryptionSuite: 'X25519-XSalsa20-Poly1305',
      },
      expires_at: input.public_key_expires_at ?? null,
      is_active: true,
    });

  if (keyError) throw new Error(`Public key registration failed: ${keyError.message}`);

  // 3. 감사 로그
  await supabase.from('audit_log').insert({
    event_type: 'vasp.registered',
    entity_type: 'vasp',
    entity_id: vasp.id,
    details: {
      vasp_entity_id: input.vasp_entity_id,
      alliance_name: input.alliance_name ?? 'bonanza',
      channel_type: input.channel_type,
    },
  });

  return vasp as VaspRecord;
}

/**
 * VASP entity ID로 조회 (공개키 포함)
 */
export async function getVaspByEntityId(entityId: string): Promise<VaspWithKeys | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('vasps')
    .select(`
      *,
      public_keys (
        id, public_key, algorithm, key_purpose, kid, version, metadata, expires_at, is_active, created_at
      )
    `)
    .eq('vasp_entity_id', entityId)
    .single();

  if (error || !data) return null;
  return data as VaspWithKeys;
}

/**
 * VASP 목록 조회 (필터 지원)
 */
export async function listVasps(filter?: VaspSearchFilter): Promise<VaspRecord[]> {
  const supabase = getServiceClient();

  let query = supabase
    .from('vasps')
    .select('*')
    .order('vasp_name');

  if (filter?.alliance_name) {
    query = query.eq('alliance_name', filter.alliance_name);
  }
  if (filter?.country) {
    query = query.eq('country_of_registration', filter.country);
  }
  if (filter?.health) {
    query = query.eq('health', filter.health);
  }
  if (filter?.search) {
    query = query.or(`vasp_name.ilike.%${filter.search}%,vasp_legal_name.ilike.%${filter.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`VASP list failed: ${error.message}`);
  return (data ?? []) as VaspRecord[];
}

/**
 * VASP 목록을 CODE VASP 호환 형식으로 변환
 */
export async function listVaspsCodeFormat(): Promise<VaspListResponse> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('vasps')
    .select(`
      vasp_entity_id,
      vasp_name,
      vasp_legal_name,
      country_of_registration,
      alliance_name,
      health,
      public_keys (
        public_key,
        algorithm,
        key_purpose,
        kid,
        version,
        metadata,
        is_active,
        expires_at
      )
    `)
    .order('vasp_name');

  if (error) throw new Error(`VASP list failed: ${error.message}`);

  return {
    vasps: (data ?? []).map((v: Record<string, unknown>) => ({
      health: v.health as string,
      vaspEntityId: v.vasp_entity_id as string,
      vaspName: v.vasp_name as string,
      vaspLegalName: v.vasp_legal_name as string,
      countryOfRegistration: v.country_of_registration as string,
      allianceName: v.alliance_name as string,
      pubkeys: ((v.public_keys as Array<Record<string, unknown>>) ?? []).map(
        (pk: Record<string, unknown>) => ({
          pubkey: pk.public_key as string,
          publicKey: pk.public_key as string,
          algorithm: (pk.algorithm as 'Ed25519') ?? 'Ed25519',
          keyPurpose: (pk.key_purpose as 'signing' | 'encryption' | 'both') ?? 'both',
          encryptionDerivation: 'ed25519_to_x25519',
          encryptionSuite: 'X25519-XSalsa20-Poly1305',
          kid: pk.kid as string | null,
          version: (pk.version as number | null) ?? 1,
          expiresAt: pk.expires_at as string,
          isActive: pk.is_active as boolean,
          metadata: (pk.metadata as Record<string, unknown>) ?? {},
        })
      ),
    })) as VaspInfo[],
  };
}

/**
 * VASP 정보 업데이트
 */
export async function updateVasp(
  entityId: string,
  updates: Partial<Pick<VaspRecord, 'vasp_name' | 'vasp_legal_name' | 'endpoint_url' | 'channel_type' | 'health' | 'metadata'>>
): Promise<VaspRecord | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('vasps')
    .update(updates)
    .eq('vasp_entity_id', entityId)
    .select()
    .single();

  if (error) throw new Error(`VASP update failed: ${error.message}`);
  return data as VaspRecord;
}

/**
 * VASP health 상태 업데이트
 */
export async function updateVaspHealth(entityId: string, health: 'up' | 'down'): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('vasps')
    .update({ health })
    .eq('vasp_entity_id', entityId);

  if (error) throw new Error(`Health update failed: ${error.message}`);
}

// ============================================================
// Public Key Management
// ============================================================

/**
 * 활성 공개키 조회 (만료되지 않은 최신 키)
 */
export async function getActivePublicKey(entityId: string): Promise<string | null> {
  const supabase = getServiceClient();

  const { data: vasp } = await supabase
    .from('vasps')
    .select('id')
    .eq('vasp_entity_id', entityId)
    .single();

  if (!vasp) return null;

  const { data: keys } = await supabase
    .from('public_keys')
    .select('public_key')
    .eq('vasp_id', vasp.id)
    .eq('is_active', true)
    .in('key_purpose', ['both', 'encryption'])
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(1);

  return keys?.[0]?.public_key ?? null;
}

/**
 * 공개키 등록 (기존 키 비활성화 후 새 키 등록 = 키 로테이션)
 */
export async function rotatePublicKey(
  entityId: string,
  newPublicKey: string,
  expiresAt?: string,
  keyPurpose: 'signing' | 'encryption' | 'both' = 'both'
): Promise<void> {
  const supabase = getServiceClient();

  const { data: vasp } = await supabase
    .from('vasps')
    .select('id')
    .eq('vasp_entity_id', entityId)
    .single();

  if (!vasp) throw new Error(`VASP not found: ${entityId}`);

  // 기존 키 비활성화
  await supabase
    .from('public_keys')
    .update({ is_active: false })
    .eq('vasp_id', vasp.id)
    .eq('is_active', true);

  // 새 키 등록
  const { error } = await supabase
    .from('public_keys')
    .insert({
      vasp_id: vasp.id,
      public_key: newPublicKey,
      algorithm: 'Ed25519',
      key_purpose: keyPurpose,
      metadata: {
        encryptionDerivation: 'ed25519_to_x25519',
        encryptionSuite: 'X25519-XSalsa20-Poly1305',
      },
      expires_at: expiresAt ?? null,
      is_active: true,
    });

  if (error) throw new Error(`Key rotation failed: ${error.message}`);

  // 감사 로그
  await supabase.from('audit_log').insert({
    event_type: 'public_key.rotated',
    entity_type: 'public_key',
    entity_id: vasp.id,
    details: { vasp_entity_id: entityId },
  });
}

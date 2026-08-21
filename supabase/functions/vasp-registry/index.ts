/**
 * VASP Registry Edge Function
 *
 * Bonanza TTR 2026-08 redesign:
 * - Registry is the public-key directory for connected VASPs.
 * - The canonical key is a Base64 Ed25519 verify key.
 * - Encryption clients derive X25519/Curve25519 from the Ed25519 key.
 * - Address verification is replaced by OwnerCheck.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase-client.ts';

type ServiceClient = ReturnType<typeof createServiceClient>;

interface PublicKeyRow {
  id: string;
  public_key: string;
  algorithm?: string | null;
  expires_at?: string | null;
  is_active?: boolean;
  key_purpose?: string | null;
  kid?: string | null;
  version?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

interface VaspRow {
  id: string;
  vasp_entity_id: string;
  vasp_name: string;
  vasp_legal_name?: string | null;
  country_of_registration?: string | null;
  alliance_name?: string | null;
  endpoint_url?: string | null;
  channel_type?: string | null;
  health?: string | null;
  metadata?: Record<string, unknown> | null;
  public_keys?: PublicKeyRow[];
}

function getSubPathParts(url: string): string[] {
  const u = new URL(url);
  const parts = u.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('vasp-registry');

  return idx >= 0 ? parts.slice(idx + 1) : [];
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(error: string, message: string, status: number): Response {
  return jsonResponse({ error, message, timestamp: new Date().toISOString() }, status);
}

function isActiveKey(key: PublicKeyRow): boolean {
  const expiresAt = key.expires_at ? new Date(key.expires_at) : null;
  const isExpired = expiresAt ? expiresAt.getTime() <= Date.now() : false;

  return key.is_active === true && !isExpired;
}

function toPublicKeyResponse(key: PublicKeyRow) {
  return {
    id: key.id,
    pubkey: key.public_key,
    publicKey: key.public_key,
    algorithm: key.algorithm || 'Ed25519',
    keyPurpose: key.key_purpose || 'both',
    encryptionDerivation: 'ed25519_to_x25519',
    encryptionSuite: 'X25519-XSalsa20-Poly1305',
    kid: key.kid,
    version: key.version ?? 1,
    expiresAt: key.expires_at,
    isActive: key.is_active,
    metadata: key.metadata || {},
    createdAt: key.created_at,
  };
}

async function findVasp(
  supabase: ServiceClient,
  vaspEntityId: string,
  includeKeys = false,
): Promise<VaspRow | null> {
  const select = includeKeys
    ? '*, public_keys(id, public_key, algorithm, expires_at, is_active, key_purpose, kid, version, metadata, created_at)'
    : '*';
  const { data } = await supabase
    .from('vasps')
    .select(select)
    .eq('vasp_entity_id', vaspEntityId)
    .maybeSingle();

  return (data as VaspRow | null) ?? null;
}

async function audit(
  supabase: ServiceClient,
  eventType: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown>,
) {
  await supabase.from('audit_log').insert({
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    details,
  });
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createServiceClient();
  const url = new URL(req.url);
  const subPathParts = getSubPathParts(req.url);
  const subPath = subPathParts[0] ?? '';

  try {
    if (req.method === 'GET') {
      if (subPath === 'pubkey') {
        return await handlePublicKeySearch(supabase, subPathParts[1] || url.searchParams.get('id'));
      }

      return await handleGet(supabase, url);
    }

    if (req.method === 'POST') {
      const body = await req.json();

      if (subPath === 'rotate-key') {
        return await handleKeyRotation(supabase, body);
      }

      if (subPath === 'address-verify') {
        return errorResponse(
          'ADDRESS_VERIFY_REPLACED',
          'Use POST /owner-check for Identical Account Owner Verification',
          410,
        );
      }

      if (subPath) {
        return errorResponse('NOT_FOUND', `Unknown sub-path: ${subPath}`, 404);
      }

      return await handleCreate(supabase, body);
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      return await handleUpdate(supabase, body);
    }

    if (req.method === 'DELETE') {
      return await handleDelete(supabase, url);
    }

    return errorResponse('METHOD_NOT_ALLOWED', `${req.method} not allowed`, 405);
  } catch (error) {
    console.error('VASP Registry error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error',
      500,
    );
  }
});

async function handleGet(supabase: ServiceClient, url: URL): Promise<Response> {
  const vaspId = url.searchParams.get('id');
  const wallet = url.searchParams.get('wallet');
  const alliance = url.searchParams.get('alliance');
  const country = url.searchParams.get('country');
  const search = url.searchParams.get('search');

  if (wallet) {
    return await handleWalletSearch(supabase, wallet);
  }

  if (vaspId) {
    const vasp = await findVasp(supabase, vaspId, true);

    if (!vasp) {
      return errorResponse('VASP_NOT_FOUND', `VASP "${vaspId}" not found`, 404);
    }

    return jsonResponse({
      ...vasp,
      public_keys: (vasp.public_keys ?? []).map(toPublicKeyResponse),
    });
  }

  let query = supabase
    .from('vasps')
    .select(`
      vasp_entity_id, vasp_name, vasp_legal_name,
      country_of_registration, alliance_name, health, channel_type,
      endpoint_url, metadata,
      public_keys(id, public_key, algorithm, expires_at, is_active, key_purpose, kid, version, metadata, created_at)
    `)
    .order('vasp_name');

  if (alliance) query = query.eq('alliance_name', alliance);
  if (country) query = query.eq('country_of_registration', country);
  if (search) query = query.or(`vasp_name.ilike.%${search}%,vasp_legal_name.ilike.%${search}%`);

  const { data: vasps, error } = await query;
  if (error) throw error;

  return jsonResponse({
    vasps: ((vasps as VaspRow[] | null) ?? []).map((vasp) => ({
      vaspEntityId: vasp.vasp_entity_id,
      vaspName: vasp.vasp_name,
      vaspLegalName: vasp.vasp_legal_name,
      countryOfRegistration: vasp.country_of_registration,
      allianceName: vasp.alliance_name,
      health: vasp.health,
      channelType: vasp.channel_type,
      endpointUrl: vasp.endpoint_url,
      metadata: vasp.metadata || {},
      pubkeys: (vasp.public_keys ?? []).map(toPublicKeyResponse),
    })),
    total: (vasps ?? []).length,
  });
}

async function handlePublicKeySearch(
  supabase: ServiceClient,
  vaspEntityId: string | null,
): Promise<Response> {
  if (!vaspEntityId) {
    return errorResponse('INVALID_REQUEST', 'VASP entity id is required', 400);
  }

  const vasp = await findVasp(supabase, vaspEntityId, true);

  if (!vasp) {
    return errorResponse('VASP_NOT_FOUND', `VASP "${vaspEntityId}" not found`, 404);
  }

  const activeKeys = (vasp.public_keys ?? []).filter(isActiveKey);

  return jsonResponse({
    vaspEntityId: vasp.vasp_entity_id,
    vaspName: vasp.vasp_name,
    allianceName: vasp.alliance_name || 'bonanza',
    health: vasp.health,
    keys: activeKeys.map(toPublicKeyResponse),
  });
}

async function handleCreate(
  supabase: ServiceClient,
  body: Record<string, unknown>,
): Promise<Response> {
  const {
    vasp_entity_id,
    vasp_name,
    vasp_legal_name,
    country_of_registration,
    alliance_name = 'bonanza',
    endpoint_url,
    channel_type = 'HTTPS',
    public_key,
    public_key_expires_at,
    key_purpose = 'both',
    kid,
    metadata = {},
  } = body;

  if (!vasp_entity_id || !vasp_name || !country_of_registration || !endpoint_url || !public_key) {
    return errorResponse(
      'INVALID_REQUEST',
      'Required: vasp_entity_id, vasp_name, country_of_registration, endpoint_url, public_key',
      400,
    );
  }

  const { data: vasp, error: vaspError } = await supabase
    .from('vasps')
    .insert({
      vasp_entity_id,
      vasp_name,
      vasp_legal_name,
      country_of_registration,
      alliance_name,
      endpoint_url,
      channel_type,
      metadata,
    })
    .select()
    .single();

  if (vaspError) {
    if (vaspError.code === '23505') {
      return errorResponse('VASP_DUPLICATE', `VASP "${vasp_entity_id}" already exists`, 409);
    }
    throw vaspError;
  }

  const { data: publicKey } = await supabase
    .from('public_keys')
    .insert({
      vasp_id: vasp.id,
      public_key,
      algorithm: 'Ed25519',
      key_purpose,
      kid: kid ?? null,
      expires_at: public_key_expires_at || null,
      is_active: true,
      metadata: {
        encryptionDerivation: 'ed25519_to_x25519',
        encryptionSuite: 'X25519-XSalsa20-Poly1305',
      },
    })
    .select()
    .single();

  await audit(supabase, 'vasp.registered', 'vasp', vasp.id, {
    vasp_entity_id,
    alliance_name,
    channel_type,
  });

  return jsonResponse({
    success: true,
    vasp,
    publicKey: publicKey ? toPublicKeyResponse(publicKey as PublicKeyRow) : undefined,
  }, 201);
}

async function handleUpdate(
  supabase: ServiceClient,
  body: Record<string, unknown>,
): Promise<Response> {
  const { vasp_entity_id, ...updates } = body;

  if (!vasp_entity_id) {
    return errorResponse('INVALID_REQUEST', 'Required: vasp_entity_id', 400);
  }

  const allowedFields = [
    'vasp_name',
    'vasp_legal_name',
    'country_of_registration',
    'alliance_name',
    'endpoint_url',
    'channel_type',
    'health',
    'metadata',
  ];
  const safeUpdates: Record<string, unknown> = {};

  for (const key of allowedFields) {
    if (key in updates) {
      safeUpdates[key] = updates[key];
    }
  }

  if (Object.keys(safeUpdates).length === 0) {
    return errorResponse('INVALID_REQUEST', 'No valid fields to update', 400);
  }

  const { data: vasp, error } = await supabase
    .from('vasps')
    .update(safeUpdates)
    .eq('vasp_entity_id', vasp_entity_id)
    .select()
    .single();

  if (error || !vasp) {
    return errorResponse('VASP_NOT_FOUND', `VASP "${vasp_entity_id}" not found`, 404);
  }

  await audit(supabase, 'vasp.updated', 'vasp', vasp.id, {
    vasp_entity_id,
    updated_fields: Object.keys(safeUpdates),
  });

  return jsonResponse({ success: true, vasp });
}

async function handleDelete(supabase: ServiceClient, url: URL): Promise<Response> {
  const vaspId = url.searchParams.get('id');

  if (!vaspId) {
    return errorResponse('INVALID_REQUEST', 'Query param "id" is required', 400);
  }

  const { data: vasp } = await supabase
    .from('vasps')
    .select('id')
    .eq('vasp_entity_id', vaspId)
    .maybeSingle();

  if (!vasp) {
    return errorResponse('VASP_NOT_FOUND', `VASP "${vaspId}" not found`, 404);
  }

  await supabase.from('vasps').delete().eq('id', vasp.id);
  await audit(supabase, 'vasp.deleted', 'vasp', vasp.id, { vasp_entity_id: vaspId });

  return jsonResponse({ success: true, deleted: vaspId });
}

async function handleKeyRotation(
  supabase: ServiceClient,
  body: Record<string, unknown>,
): Promise<Response> {
  const {
    vasp_entity_id,
    new_public_key,
    expires_at,
    key_purpose = 'both',
    kid,
    metadata = {},
  } = body;

  if (!vasp_entity_id || !new_public_key) {
    return errorResponse('INVALID_REQUEST', 'Required: vasp_entity_id, new_public_key', 400);
  }

  const vasp = await findVasp(supabase, vasp_entity_id as string);

  if (!vasp) {
    return errorResponse('VASP_NOT_FOUND', `VASP "${vasp_entity_id}" not found`, 404);
  }

  await supabase
    .from('public_keys')
    .update({ is_active: false })
    .eq('vasp_id', vasp.id)
    .eq('is_active', true);

  const { data: newKey, error } = await supabase
    .from('public_keys')
    .insert({
      vasp_id: vasp.id,
      public_key: new_public_key,
      algorithm: 'Ed25519',
      key_purpose,
      kid: kid ?? null,
      expires_at: (expires_at as string) ?? null,
      is_active: true,
      metadata: {
        ...(metadata as Record<string, unknown>),
        encryptionDerivation: 'ed25519_to_x25519',
        encryptionSuite: 'X25519-XSalsa20-Poly1305',
      },
    })
    .select()
    .single();

  if (error) throw error;

  await audit(supabase, 'public_key.rotated', 'public_key', newKey.id, {
    vasp_entity_id,
    key_purpose,
  });

  return jsonResponse({
    success: true,
    vasp_entity_id,
    new_key: toPublicKeyResponse(newKey as PublicKeyRow),
  });
}

async function handleWalletSearch(supabase: ServiceClient, wallet: string): Promise<Response> {
  const { data: transfers } = await supabase
    .from('transfers')
    .select('beneficiary_vasp_id, originator_vasp_id, ivms101_metadata')
    .or(`ivms101_metadata->>address.eq.${wallet}`)
    .limit(5);

  if (!transfers || transfers.length === 0) {
    return jsonResponse({ found: false, wallet, candidates: [] });
  }

  const vaspIds = new Set<string>();

  for (const transfer of transfers) {
    if (transfer.beneficiary_vasp_id) vaspIds.add(transfer.beneficiary_vasp_id);
    if (transfer.originator_vasp_id) vaspIds.add(transfer.originator_vasp_id);
  }

  const { data: vasps } = await supabase
    .from('vasps')
    .select('vasp_entity_id, vasp_name, alliance_name, health')
    .in('id', Array.from(vaspIds));

  return jsonResponse({
    found: true,
    wallet,
    candidates: (vasps ?? []).map((vasp: Record<string, unknown>) => ({
      vaspEntityId: vasp.vasp_entity_id,
      vaspName: vasp.vasp_name,
      allianceName: vasp.alliance_name,
      health: vasp.health,
    })),
  });
}

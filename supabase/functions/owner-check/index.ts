/**
 * OwnerCheck Edge Function
 *
 * Bonanza extension for Identical Account Owner Verification.
 * This is intentionally outside the `/v1/code/*` namespace because it was not
 * part of the original CodeVASP API surface used by this project.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase-client.ts';
import { routeOwnerCheck } from '../_shared/protocol-adapter.ts';
import type { AdapterOwnerCheckRequest, VaspTarget } from '../_shared/protocol-adapter.ts';

type ServiceClient = ReturnType<typeof createServiceClient>;

interface PublicKeyRow {
  public_key: string;
  expires_at?: string | null;
  is_active?: boolean;
  key_purpose?: string | null;
}

interface VaspRow {
  id: string;
  vasp_entity_id: string;
  vasp_name: string;
  alliance_name?: string | null;
  endpoint_url?: string | null;
  health?: string | null;
  metadata?: Record<string, unknown> | null;
  public_keys?: PublicKeyRow[];
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

function getPathBeneficiary(url: string): string | undefined {
  const u = new URL(url);
  const parts = u.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('owner-check');

  return idx >= 0 && idx + 1 < parts.length ? parts[idx + 1] : undefined;
}

function getActiveEncryptionKey(vasp: VaspRow): string | undefined {
  const activeKeys = (vasp.public_keys ?? []).filter((key) => {
    const isActive = key.is_active === true;
    const expiresAt = key.expires_at ? new Date(key.expires_at) : null;
    const isExpired = expiresAt ? expiresAt.getTime() <= Date.now() : false;
    const purpose = key.key_purpose || 'both';

    return isActive && !isExpired && (purpose === 'both' || purpose === 'encryption');
  });

  return activeKeys[0]?.public_key;
}

async function findVasp(supabase: ServiceClient, vaspEntityId: string): Promise<VaspRow | null> {
  const { data } = await supabase
    .from('vasps')
    .select('*, public_keys(public_key, expires_at, is_active, key_purpose)')
    .eq('vasp_entity_id', vaspEntityId)
    .maybeSingle();

  return (data as VaspRow | null) ?? null;
}

async function audit(
  supabase: ServiceClient,
  eventType: string,
  entityId: string | null,
  details: Record<string, unknown>,
) {
  await supabase.from('audit_log').insert({
    event_type: eventType,
    entity_type: 'owner_check',
    entity_id: entityId,
    details,
  });
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createServiceClient();
  const url = new URL(req.url);

  try {
    if (req.method === 'GET') {
      return await handleLookup(supabase, url);
    }

    if (req.method !== 'POST') {
      return errorResponse('METHOD_NOT_ALLOWED', `${req.method} not allowed`, 405);
    }

    const body = await req.json();
    return await handleOwnerCheck(supabase, body, getPathBeneficiary(req.url));
  } catch (error) {
    console.error('OwnerCheck error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error',
      500,
    );
  }
});

async function handleLookup(supabase: ServiceClient, url: URL): Promise<Response> {
  const ownerCheckId = url.searchParams.get('id');

  if (!ownerCheckId) {
    return errorResponse('INVALID_REQUEST', 'Query param "id" is required', 400);
  }

  const { data } = await supabase
    .from('owner_checks')
    .select(`
      owner_check_id, status, currency, address, tag, network,
      result, reason_type, reason_msg, policy, metadata,
      created_at, updated_at
    `)
    .eq('owner_check_id', ownerCheckId)
    .maybeSingle();

  if (!data) {
    return errorResponse('OWNER_CHECK_NOT_FOUND', `OwnerCheck "${ownerCheckId}" not found`, 404);
  }

  return jsonResponse({
    ownerCheckId: data.owner_check_id,
    status: data.status,
    currency: data.currency,
    address: data.address,
    tag: data.tag,
    network: data.network,
    result: data.result,
    reasonType: data.reason_type,
    reasonMsg: data.reason_msg,
    policy: data.policy,
    metadata: data.metadata,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  });
}

async function handleOwnerCheck(
  supabase: ServiceClient,
  body: Record<string, unknown>,
  pathBeneficiaryVaspEntityId?: string,
): Promise<Response> {
  const {
    ownerCheckId,
    currency,
    address,
    tag,
    network,
    payload,
    originatorVaspEntityId,
    beneficiaryVaspEntityId = pathBeneficiaryVaspEntityId,
    policy = { requireDobMatch: true },
  } = body;

  if (!ownerCheckId || !currency || !address || !payload || !beneficiaryVaspEntityId) {
    return errorResponse(
      'INVALID_REQUEST',
      'Required: ownerCheckId, currency, address, payload, beneficiaryVaspEntityId',
      400,
    );
  }

  const { data: existing } = await supabase
    .from('owner_checks')
    .select('id')
    .eq('owner_check_id', ownerCheckId as string)
    .maybeSingle();

  if (existing) {
    return errorResponse('OWNER_CHECK_DUPLICATE', `OwnerCheckId "${ownerCheckId}" already exists`, 409);
  }

  const originatorVasp = originatorVaspEntityId
    ? await findVasp(supabase, originatorVaspEntityId as string)
    : null;
  const beneficiaryVasp = await findVasp(supabase, beneficiaryVaspEntityId as string);

  if (!beneficiaryVasp) {
    return errorResponse('VASP_NOT_FOUND', `Beneficiary VASP "${beneficiaryVaspEntityId}" not found`, 404);
  }

  if (beneficiaryVasp.health === 'down') {
    return errorResponse('VASP_HEALTH_DOWN', `Beneficiary VASP "${beneficiaryVaspEntityId}" is down`, 503);
  }

  const beneficiaryPublicKey = getActiveEncryptionKey(beneficiaryVasp);

  if (!beneficiaryPublicKey) {
    return errorResponse(
      'VASP_KEY_NOT_FOUND',
      `Beneficiary VASP "${beneficiaryVaspEntityId}" has no active encryption public key`,
      409,
    );
  }

  const { data: ownerCheck, error: insertError } = await supabase
    .from('owner_checks')
    .insert({
      owner_check_id: ownerCheckId,
      status: 'pending',
      originator_vasp_id: originatorVasp?.id ?? null,
      beneficiary_vasp_id: beneficiaryVasp.id,
      currency,
      address,
      tag: tag ?? null,
      network: network ?? null,
      payload_encrypted: payload,
      policy,
      metadata: {
        originatorVaspEntityId: originatorVaspEntityId ?? null,
        beneficiaryVaspEntityId,
      },
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`OwnerCheck insert failed: ${insertError.message}`);
  }

  const target: VaspTarget = {
    id: beneficiaryVasp.id,
    vaspEntityId: beneficiaryVasp.vasp_entity_id,
    name: beneficiaryVasp.vasp_name,
    allianceName: beneficiaryVasp.alliance_name || 'bonanza',
    endpointUrl: beneficiaryVasp.endpoint_url || undefined,
    publicKey: beneficiaryPublicKey,
    metadata: beneficiaryVasp.metadata || undefined,
  };
  const callbackBaseUrl = Deno.env.get('BONANZA_TTR_CALLBACK_BASE_URL');
  const request: AdapterOwnerCheckRequest = {
    ownerCheckId: ownerCheckId as string,
    currency: currency as string,
    address: address as string,
    tag: tag as string | undefined,
    network: network as string | undefined,
    payload,
    originatorVaspEntityId: originatorVaspEntityId as string | undefined,
    beneficiaryVaspEntityId: beneficiaryVaspEntityId as string,
    beneficiaryPublicKey,
    callbackUrl: callbackBaseUrl ? `${callbackBaseUrl}/owner-check/result` : undefined,
    policy: policy as Record<string, unknown>,
  };

  const startedAt = Date.now();
  let result: 'verified' | 'denied' | 'pending';
  let reasonType = '';
  let reasonMsg = '';
  let responsePayload: unknown;

  try {
    const adapterResponse = await routeOwnerCheck(request, target);
    result = adapterResponse.result;
    reasonType = adapterResponse.reasonType ?? '';
    reasonMsg = adapterResponse.reasonMsg ?? '';
    responsePayload = adapterResponse.responsePayload;
  } catch (error) {
    result = 'denied';
    reasonType = 'OWNER_CHECK_RELAY_ERROR';
    reasonMsg = error instanceof Error ? error.message : 'OwnerCheck relay failed';
  }

  const latencyMs = Date.now() - startedAt;
  const status = result === 'verified' ? 'verified' : result === 'pending' ? 'pending' : 'denied';

  await supabase
    .from('owner_checks')
    .update({
      status,
      result,
      reason_type: reasonType || null,
      reason_msg: reasonMsg || null,
      metadata: {
        originatorVaspEntityId: originatorVaspEntityId ?? null,
        beneficiaryVaspEntityId,
        latencyMs,
        protocol: target.allianceName || 'bonanza',
      },
    })
    .eq('id', ownerCheck.id);

  await audit(supabase, 'owner_check.relayed', ownerCheck.id, {
    owner_check_id: ownerCheckId,
    result,
    beneficiary_vasp: beneficiaryVaspEntityId,
    latency_ms: latencyMs,
  });

  return jsonResponse({
    result,
    reasonType: reasonType || undefined,
    reasonMsg: reasonMsg || undefined,
    ownerCheckId,
    beneficiaryVasp: {
      vaspEntityId: beneficiaryVasp.vasp_entity_id,
      vaspName: beneficiaryVasp.vasp_name,
    },
    payload: responsePayload,
    adapter: {
      protocol: target.allianceName || 'bonanza',
      latencyMs,
    },
  }, 201);
}

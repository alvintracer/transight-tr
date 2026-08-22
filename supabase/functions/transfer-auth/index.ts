/**
 * Transfer Authorization Edge Function
 *
 * TravelSafer 2026-08 redesign:
 * - CodeVASP-compatible relay is the default data plane.
 * - The beneficiary VASP and an active encryption public key are mandatory.
 * - Bonanza relays encrypted IVMS101 payloads and keeps transaction metadata.
 * - KYT atomic block still happens before PII relay.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase-client.ts';
import { routeTransfer } from '../_shared/protocol-adapter.ts';
import type { AdapterTransferRequest, VaspTarget } from '../_shared/protocol-adapter.ts';
import { atomicGate } from '../_shared/kyt-gate.ts';
import type { KytCheckResult, VaspKytConfig } from '../_shared/kyt-gate.ts';

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

function getSubPath(url: string): string {
  const u = new URL(url);
  const parts = u.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('transfer-auth');

  return idx >= 0 && idx + 1 < parts.length ? parts[idx + 1] : '';
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

async function findVasp(
  supabase: ServiceClient,
  vaspEntityId: string,
  includeKeys = false,
): Promise<VaspRow | null> {
  const select = includeKeys
    ? '*, public_keys(public_key, expires_at, is_active, key_purpose)'
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
  entityId: string | null,
  details: Record<string, unknown>,
) {
  await supabase.from('audit_log').insert({
    event_type: eventType,
    entity_type: 'transfer',
    entity_id: entityId,
    details,
  });
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createServiceClient();
  const url = new URL(req.url);
  const subPath = getSubPath(req.url);

  try {
    if (req.method === 'GET') {
      return await handleTransferLookup(supabase, url);
    }

    if (req.method === 'POST') {
      const body = await req.json();

      if (subPath === 'result') {
        return await handleTransferResult(supabase, body);
      }

      if (subPath === 'finish') {
        return await handleTransferFinish(supabase, body);
      }

      if (subPath === 'incoming') {
        return await handleIncomingTransfer(supabase, body);
      }

      return await handleOutgoingTransfer(supabase, body);
    }

    return errorResponse('METHOD_NOT_ALLOWED', `${req.method} not allowed`, 405);
  } catch (error) {
    console.error('Transfer Auth error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error',
      500,
    );
  }
});

async function handleTransferLookup(supabase: ServiceClient, url: URL): Promise<Response> {
  const transferId = url.searchParams.get('id');

  if (!transferId) {
    return errorResponse('INVALID_REQUEST', 'Query param "id" is required', 400);
  }

  const { data: transfer } = await supabase
    .from('transfers')
    .select(`
      transfer_id, status, direction, currency, amount,
      trade_price, trade_currency, is_exceeding_threshold,
      result, reason_type, reason_msg, txid,
      created_at, updated_at
    `)
    .eq('transfer_id', transferId)
    .maybeSingle();

  if (!transfer) {
    return errorResponse('TRANSFER_NOT_FOUND', `Transfer "${transferId}" not found`, 404);
  }

  return jsonResponse({
    transferId: transfer.transfer_id,
    status: transfer.status,
    direction: transfer.direction,
    currency: transfer.currency,
    amount: transfer.amount,
    tradePrice: transfer.trade_price,
    tradeCurrency: transfer.trade_currency,
    result: transfer.result,
    reasonType: transfer.reason_type,
    reasonMsg: transfer.reason_msg,
    txid: transfer.txid,
    createdAt: transfer.created_at,
    updatedAt: transfer.updated_at,
  });
}

async function handleOutgoingTransfer(
  supabase: ServiceClient,
  body: Record<string, unknown>,
): Promise<Response> {
  const {
    transferId,
    currency,
    amount,
    tradePrice,
    tradeCurrency = 'KRW',
    isExceedingThreshold = false,
    payload,
    address,
    tag,
    network,
    beneficiaryVaspEntityId,
    originatorVaspEntityId,
    adapterOptions,
  } = body;

  if (!transferId || !currency || !amount || !payload || !beneficiaryVaspEntityId) {
    return errorResponse(
      'INVALID_REQUEST',
      'Required: transferId, currency, amount, payload, beneficiaryVaspEntityId',
      400,
    );
  }

  const { data: existing } = await supabase
    .from('transfers')
    .select('id')
    .eq('transfer_id', transferId as string)
    .maybeSingle();

  if (existing) {
    return errorResponse('TRANSFER_DUPLICATE', `TransferId "${transferId}" already exists`, 409);
  }

  const originatorVasp = originatorVaspEntityId
    ? await findVasp(supabase, originatorVaspEntityId as string)
    : null;
  const beneficiaryVasp = await findVasp(supabase, beneficiaryVaspEntityId as string, true);

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

  const vaspKytConfig = originatorVasp
    ? await loadKytConfig(supabase, originatorVasp.id)
    : undefined;
  const blockRegistry = vaspKytConfig?.kytAutoBlock && originatorVasp
    ? await loadBlockRegistry(supabase, originatorVasp.id)
    : [];

  const gateResult = await atomicGate(
    {
      address: (address as string) ?? '',
      currency: currency as string,
      amount: amount as string,
      beneficiaryVaspEntityId: beneficiaryVaspEntityId as string,
      network: network as string | undefined,
      transferId: transferId as string,
    },
    vaspKytConfig,
    blockRegistry,
  );
  const kytResult: KytCheckResult = gateResult.kytResult;

  if (gateResult.finalDecision === 'block') {
    const { data: transfer } = await supabase
      .from('transfers')
      .insert({
        transfer_id: transferId,
        status: 'denied',
        direction: 'outgoing',
        originator_vasp_id: originatorVasp?.id ?? null,
        beneficiary_vasp_id: beneficiaryVasp.id,
        currency,
        amount,
        trade_price: tradePrice,
        trade_currency: tradeCurrency,
        is_exceeding_threshold: isExceedingThreshold,
        result: 'denied',
        reason_type: 'KYT_BLOCK',
        reason_msg: gateResult.blockReason ?? 'KYT risk assessment blocked this transfer',
        kyt_result: kytResult,
      })
      .select()
      .single();

    await audit(supabase, 'transfer.kyt_blocked', transfer?.id ?? null, {
      transfer_id: transferId,
      kyt: kytResult,
      address: address ?? null,
      beneficiary_vasp: beneficiaryVaspEntityId,
    });

    return jsonResponse({
      result: 'denied',
      reasonType: 'KYT_BLOCK',
      reasonMsg: gateResult.blockReason ?? 'KYT risk assessment blocked this transfer. PII was not transmitted.',
      transferId,
      kyt: {
        decision: kytResult.decision,
        riskScore: kytResult.riskScore,
        riskCategory: kytResult.riskCategory,
        riskLabels: kytResult.riskLabels,
        provider: kytResult.provider,
      },
    }, 201);
  }

  const { data: transfer, error: insertError } = await supabase
    .from('transfers')
    .insert({
      transfer_id: transferId,
      status: 'wait',
      direction: 'outgoing',
      originator_vasp_id: originatorVasp?.id ?? null,
      beneficiary_vasp_id: beneficiaryVasp.id,
      currency,
      amount,
      trade_price: tradePrice,
      trade_currency: tradeCurrency,
      is_exceeding_threshold: isExceedingThreshold,
      payload_encrypted: payload,
      kyt_result: kytResult,
      ivms101_metadata: {
        address: address ?? null,
        tag: tag ?? null,
        network: network ?? null,
      },
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Transfer insert failed: ${insertError.message}`);
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
  const adapterRequest: AdapterTransferRequest = {
    transferId: transferId as string,
    currency: currency as string,
    amount: amount as string,
    payload,
    originatorVaspEntityId: originatorVaspEntityId as string | undefined,
    beneficiaryVaspEntityId: beneficiaryVaspEntityId as string,
    beneficiaryPublicKey,
    callbackUrl: callbackBaseUrl ? `${callbackBaseUrl}/transfer-auth/result` : undefined,
    adapterOptions: adapterOptions as Record<string, unknown> | undefined,
  };

  const startedAt = Date.now();
  let transferResult: 'verified' | 'denied' | 'pending';
  let reasonType = '';
  let reasonMsg = '';
  let adapterProtocol = 'bonanza';
  let responsePayload: unknown;

  try {
    const adapterResponse = await routeTransfer(adapterRequest, target);

    transferResult = adapterResponse.result;
    reasonType = adapterResponse.reasonType ?? '';
    reasonMsg = adapterResponse.reasonMsg ?? '';
    adapterProtocol = adapterResponse.protocol ?? 'bonanza';
    responsePayload = adapterResponse.responsePayload;
  } catch (error) {
    transferResult = 'denied';
    reasonType = 'RELAY_ERROR';
    reasonMsg = error instanceof Error ? error.message : 'Counterparty relay failed';
  }

  const adapterLatencyMs = Date.now() - startedAt;
  const newStatus = transferResult === 'verified'
    ? 'verified'
    : transferResult === 'pending'
      ? 'pending'
      : 'denied';

  await supabase
    .from('transfers')
    .update({
      status: newStatus,
      result: transferResult,
      reason_type: reasonType || null,
      reason_msg: reasonMsg || null,
    })
    .eq('id', transfer.id);

  await audit(supabase, 'transfer.relayed', transfer.id, {
    transfer_id: transferId,
    result: transferResult,
    kyt: kytResult.decision,
    beneficiary_vasp: beneficiaryVaspEntityId,
    protocol: adapterProtocol,
    adapter_latency_ms: adapterLatencyMs,
  });

  return jsonResponse({
    result: transferResult,
    reasonType: reasonType || undefined,
    reasonMsg: reasonMsg || undefined,
    transferId,
    beneficiaryVasp: {
      vaspEntityId: beneficiaryVasp.vasp_entity_id,
      vaspName: beneficiaryVasp.vasp_name,
    },
    payload: responsePayload,
    kyt: {
      decision: kytResult.decision,
      riskScore: kytResult.riskScore,
    },
    adapter: {
      protocol: adapterProtocol,
      latencyMs: adapterLatencyMs,
    },
  }, 201);
}

async function loadKytConfig(
  supabase: ServiceClient,
  vaspId: string,
): Promise<VaspKytConfig | undefined> {
  const { data } = await supabase
    .from('vasps')
    .select('kyt_mode, kyt_scope, kyt_auto_block, kyt_return_for_sar')
    .eq('id', vaspId)
    .maybeSingle();

  if (!data) return undefined;

  return {
    kytMode: data.kyt_mode as 'none' | 'kyt_only' | 'atomic',
    kytScope: data.kyt_scope as 'tr_only' | 'all',
    kytAutoBlock: data.kyt_auto_block as boolean,
    kytReturnForSar: data.kyt_return_for_sar as boolean,
  };
}

async function loadBlockRegistry(
  supabase: ServiceClient,
  vaspId: string,
): Promise<Array<{
  ra_code2: string;
  risk_analysis_type: string | null;
  max_hop_count: number | null;
  description: string | null;
  is_active: boolean;
}>> {
  const { data } = await supabase
    .from('kyt_tr_block_registry')
    .select('ra_code2, risk_analysis_type, max_hop_count, description, is_active')
    .eq('vasp_id', vaspId)
    .eq('is_active', true);

  return data ?? [];
}

async function handleIncomingTransfer(
  supabase: ServiceClient,
  body: Record<string, unknown>,
): Promise<Response> {
  const {
    transferId,
    currency,
    amount,
    tradePrice,
    tradeCurrency = 'KRW',
    payload,
    originatorVaspEntityId,
    beneficiaryVaspEntityId,
  } = body;

  if (!transferId || !currency || !amount || !payload) {
    return errorResponse('INVALID_REQUEST', 'Required: transferId, currency, amount, payload', 400);
  }

  const originatorVasp = originatorVaspEntityId
    ? await findVasp(supabase, originatorVaspEntityId as string)
    : null;
  const beneficiaryVasp = beneficiaryVaspEntityId
    ? await findVasp(supabase, beneficiaryVaspEntityId as string)
    : null;

  const { data: transfer, error } = await supabase
    .from('transfers')
    .insert({
      transfer_id: transferId,
      status: 'pending',
      direction: 'incoming',
      originator_vasp_id: originatorVasp?.id ?? null,
      beneficiary_vasp_id: beneficiaryVasp?.id ?? null,
      currency,
      amount,
      trade_price: tradePrice,
      trade_currency: tradeCurrency,
      payload_encrypted: payload,
      result: 'pending',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return errorResponse('TRANSFER_DUPLICATE', `TransferId "${transferId}" already exists`, 409);
    }
    throw error;
  }

  const matchKey = `${beneficiaryVaspEntityId ?? 'unknown'}:${currency}:${amount}`;
  await supabase.from('ttl_queue').insert({
    match_key: matchKey,
    transfer_id: transfer.id,
    transfer_data: { transferId, currency, amount, originatorVaspEntityId },
    ttl_seconds: 3600,
    expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
  });

  await audit(supabase, 'transfer.incoming_received', transfer.id, {
    transfer_id: transferId,
    from_vasp: originatorVaspEntityId,
    to_vasp: beneficiaryVaspEntityId,
  });

  return jsonResponse({
    result: 'pending',
    transferId,
    message: 'Incoming transfer recorded and queued for beneficiary verification',
  }, 201);
}

async function handleTransferResult(
  supabase: ServiceClient,
  body: Record<string, unknown>,
): Promise<Response> {
  const { transferId, txid, vout } = body;

  if (!transferId || !txid) {
    return errorResponse('INVALID_REQUEST', 'Required: transferId, txid', 400);
  }

  const { data: transfer } = await supabase
    .from('transfers')
    .select('id, status, transfer_id')
    .eq('transfer_id', transferId as string)
    .maybeSingle();

  if (!transfer) {
    return errorResponse('TRANSFER_NOT_FOUND', `Transfer "${transferId}" not found`, 404);
  }

  const validStatuses = ['wait', 'verified', 'pending', 'processing', 'wait-confirmed'];
  if (!validStatuses.includes(transfer.status)) {
    return errorResponse(
      'TRANSFER_INVALID_STATUS',
      `Cannot report result for transfer in "${transfer.status}" status`,
      400,
    );
  }

  await supabase
    .from('transfers')
    .update({
      txid: txid as string,
      vout: (vout as string) ?? null,
      status: 'confirmed',
    })
    .eq('id', transfer.id);

  await audit(supabase, 'transfer.result_reported', transfer.id, {
    transfer_id: transferId,
    txid,
    vout,
  });

  return jsonResponse({
    result: 'success',
    transferId,
    txid,
    status: 'confirmed',
  });
}

async function handleTransferFinish(
  supabase: ServiceClient,
  body: Record<string, unknown>,
): Promise<Response> {
  const { transferId, reasonType, reasonMsg } = body;

  if (!transferId) {
    return errorResponse('INVALID_REQUEST', 'Required: transferId', 400);
  }

  const { data: transfer } = await supabase
    .from('transfers')
    .select('id, status')
    .eq('transfer_id', transferId as string)
    .maybeSingle();

  if (!transfer) {
    return errorResponse('TRANSFER_NOT_FOUND', `Transfer "${transferId}" not found`, 404);
  }

  if (['denied', 'canceled', 'confirmed'].includes(transfer.status)) {
    return errorResponse(
      'TRANSFER_INVALID_STATUS',
      `Transfer is already in terminal state "${transfer.status}"`,
      400,
    );
  }

  await supabase
    .from('transfers')
    .update({
      status: 'canceled',
      result: 'denied',
      reason_type: (reasonType as string) ?? 'CANCELED_BY_USER',
      reason_msg: (reasonMsg as string) ?? 'Transfer canceled',
    })
    .eq('id', transfer.id);

  await audit(supabase, 'transfer.canceled', transfer.id, {
    transfer_id: transferId,
    reason: reasonType ?? 'CANCELED_BY_USER',
  });

  return jsonResponse({
    result: 'success',
    transferId,
    status: 'canceled',
  });
}

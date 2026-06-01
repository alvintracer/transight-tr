/**
 * Transfer Response Edge Function — 수신 VASP 응답 처리
 * 
 * TranSight Hub의 수신측(Beneficiary) API:
 * 
 *   POST /transfer-response/confirm       → 수신인 확인 (MATCHED)
 *   POST /transfer-response/deny          → 수신인 거부 (NOT_MATCHED)
 *   POST /transfer-response/beneficiary   → 수신인 IVMS101 제공 (2차 교환)
 *   GET  /transfer-response/pending       → 확인 대기 중인 입금 TR 목록
 *   GET  /transfer-response?id={id}       → 개별 입금 TR 상세 조회
 *   POST /transfer-response/webhook       → 외부 솔루션 비동기 콜백 (Sumsub 등)
 * 
 * 8단계 핸드셰이크에서의 위치:
 *   Step 4: Hub → 수신 VASP (incoming 수신)
 *   Step 5: 수신 VASP → Hub (confirm/deny ← 이 함수)
 *   Step 6: Hub → 송신 VASP (2차 IVMS101 전달)
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase-client.ts';

// ============================================================
// Helper
// ============================================================

function getSubPath(url: string): string {
  const u = new URL(url);
  const parts = u.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('transfer-response');
  return idx >= 0 && idx + 1 < parts.length ? parts[idx + 1] : '';
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(error: string, message: string, status: number) {
  return jsonResponse({ error, message, timestamp: new Date().toISOString() }, status);
}

// ============================================================
// Main Handler
// ============================================================

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createServiceClient();
  const url = new URL(req.url);
  const subPath = getSubPath(req.url);

  try {
    // ========================================
    // GET — 조회
    // ========================================
    if (req.method === 'GET') {
      // 확인 대기 중인 입금 TR 목록
      if (subPath === 'pending') {
        return await handleListPending(supabase, url);
      }

      // 개별 입금 TR 상세
      const transferId = url.searchParams.get('id');
      if (!transferId) {
        return errorResponse('INVALID_REQUEST', 'Query param "id" required, or use /pending', 400);
      }
      return await handleGetIncoming(supabase, transferId);
    }

    // ========================================
    // POST — 응답 처리
    // ========================================
    if (req.method === 'POST') {
      const body = await req.json();

      // 수신인 확인 (MATCHED)
      if (subPath === 'confirm') {
        return await handleConfirm(supabase, body);
      }

      // 수신인 거부 (NOT_MATCHED)
      if (subPath === 'deny') {
        return await handleDeny(supabase, body);
      }

      // 수신인 IVMS101 제공 (2차 교환)
      if (subPath === 'beneficiary') {
        return await handleBeneficiaryData(supabase, body);
      }

      // 외부 Webhook 콜백 (Sumsub 등 비동기)
      if (subPath === 'webhook') {
        return await handleWebhook(supabase, body, req);
      }

      return errorResponse('INVALID_PATH', `Unknown sub-path: ${subPath}`, 404);
    }

    return errorResponse('METHOD_NOT_ALLOWED', `${req.method} not allowed`, 405);

  } catch (error) {
    console.error('Transfer Response error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
});

// ============================================================
// 확인 대기 중인 입금 TR 목록
// ============================================================

async function handleListPending(
  supabase: ReturnType<typeof createServiceClient>,
  url: URL,
) {
  const vaspEntityId = url.searchParams.get('vasp');
  const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

  let query = supabase
    .from('transfers')
    .select(`
      transfer_id, status, direction, currency, amount,
      trade_price, trade_currency, is_exceeding_threshold,
      payload_encrypted, ivms101_metadata,
      created_at, updated_at,
      originator_vasp:originator_vasp_id(vasp_entity_id, vasp_name),
      beneficiary_vasp:beneficiary_vasp_id(vasp_entity_id, vasp_name)
    `, { count: 'exact' })
    .eq('direction', 'incoming')
    .in('status', ['wait', 'verified', 'pending'])
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // VASP 필터
  if (vaspEntityId) {
    const { data: vasp } = await supabase
      .from('vasps')
      .select('id')
      .eq('vasp_entity_id', vaspEntityId)
      .maybeSingle();

    if (vasp) {
      query = query.eq('beneficiary_vasp_id', vasp.id);
    }
  }

  const { data, count, error } = await query;

  if (error) throw error;

  return jsonResponse({
    transfers: (data ?? []).map(formatTransferResponse),
    total: count ?? 0,
    limit,
    offset,
  });
}

// ============================================================
// 개별 입금 TR 상세 조회
// ============================================================

async function handleGetIncoming(
  supabase: ReturnType<typeof createServiceClient>,
  transferId: string,
) {
  const { data, error } = await supabase
    .from('transfers')
    .select(`
      transfer_id, status, direction, currency, amount,
      trade_price, trade_currency, is_exceeding_threshold,
      payload_encrypted, ivms101_metadata,
      result, reason_type, reason_msg, txid,
      created_at, updated_at,
      originator_vasp:originator_vasp_id(vasp_entity_id, vasp_name),
      beneficiary_vasp:beneficiary_vasp_id(vasp_entity_id, vasp_name)
    `)
    .eq('transfer_id', transferId)
    .single();

  if (error || !data) {
    return errorResponse('TRANSFER_NOT_FOUND', `Transfer "${transferId}" not found`, 404);
  }

  return jsonResponse(formatTransferResponse(data));
}

// ============================================================
// 수신인 확인 (MATCHED) — Step 5
// ============================================================

async function handleConfirm(
  supabase: ReturnType<typeof createServiceClient>,
  body: Record<string, unknown>,
) {
  const { transferId, beneficiaryPayload } = body;

  if (!transferId) {
    return errorResponse('INVALID_REQUEST', 'Required: transferId', 400);
  }

  // Transfer 조회
  const { data: transfer } = await supabase
    .from('transfers')
    .select('id, status, direction, originator_vasp_id, beneficiary_vasp_id')
    .eq('transfer_id', transferId as string)
    .single();

  if (!transfer) {
    return errorResponse('TRANSFER_NOT_FOUND', `Transfer "${transferId}" not found`, 404);
  }

  // 이미 처리된 상태 확인
  if (['confirmed', 'denied', 'canceled'].includes(transfer.status)) {
    return errorResponse(
      'TRANSFER_ALREADY_PROCESSED',
      `Transfer is in terminal state "${transfer.status}"`,
      400,
    );
  }

  // 상태 업데이트: wait/pending → verified
  await supabase
    .from('transfers')
    .update({
      status: 'verified',
      result: 'verified',
      reason_type: 'BENEFICIARY_CONFIRMED',
      reason_msg: 'Beneficiary confirmed the recipient',
      // 수신인 IVMS101 응답이 있으면 저장
      ...(beneficiaryPayload ? {
        ivms101_metadata: supabase.rpc ? undefined : {
          beneficiary_response: beneficiaryPayload,
          confirmed_at: new Date().toISOString(),
        },
      } : {}),
    })
    .eq('id', transfer.id);

  // 송신 VASP에 확인 결과 전달 (비동기)
  // 송신 VASP의 callback URL이 있으면 호출
  if (transfer.originator_vasp_id) {
    const { data: origVasp } = await supabase
      .from('vasps')
      .select('vasp_entity_id, endpoint_url')
      .eq('id', transfer.originator_vasp_id)
      .single();

    if (origVasp?.endpoint_url) {
      // 비동기 콜백 (fire-and-forget)
      fetch(`${origVasp.endpoint_url}/transfer/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId,
          status: 'verified',
          result: 'verified',
          reasonType: 'BENEFICIARY_CONFIRMED',
          beneficiaryPayload: beneficiaryPayload ?? null,
        }),
      }).catch(err => {
        console.warn(`[Response] Callback to ${origVasp.vasp_entity_id} failed:`, err);
      });
    }
  }

  // 감사 로그
  await supabase.from('audit_log').insert({
    event_type: 'transfer.beneficiary_confirmed',
    entity_type: 'transfer',
    entity_id: transfer.id,
    details: {
      transfer_id: transferId,
      has_payload: !!beneficiaryPayload,
    },
  });

  return jsonResponse({
    result: 'confirmed',
    transferId,
    status: 'verified',
    message: 'Beneficiary confirmed. Originator VASP notified.',
  });
}

// ============================================================
// 수신인 거부 (NOT_MATCHED) — Step 5 (denial)
// ============================================================

async function handleDeny(
  supabase: ReturnType<typeof createServiceClient>,
  body: Record<string, unknown>,
) {
  const { transferId, reasonType, reasonMsg } = body;

  if (!transferId) {
    return errorResponse('INVALID_REQUEST', 'Required: transferId', 400);
  }

  const { data: transfer } = await supabase
    .from('transfers')
    .select('id, status, originator_vasp_id')
    .eq('transfer_id', transferId as string)
    .single();

  if (!transfer) {
    return errorResponse('TRANSFER_NOT_FOUND', `Transfer "${transferId}" not found`, 404);
  }

  if (['confirmed', 'denied', 'canceled'].includes(transfer.status)) {
    return errorResponse(
      'TRANSFER_ALREADY_PROCESSED',
      `Transfer is in terminal state "${transfer.status}"`,
      400,
    );
  }

  const denyReasonType = (reasonType as string) ?? 'NOT_MATCHED';
  const denyReasonMsg = (reasonMsg as string) ?? 'Beneficiary denied the recipient';

  // 상태 업데이트: → denied
  await supabase
    .from('transfers')
    .update({
      status: 'denied',
      result: 'denied',
      reason_type: denyReasonType,
      reason_msg: denyReasonMsg,
    })
    .eq('id', transfer.id);

  // 송신 VASP에 거부 결과 전달
  if (transfer.originator_vasp_id) {
    const { data: origVasp } = await supabase
      .from('vasps')
      .select('vasp_entity_id, endpoint_url')
      .eq('id', transfer.originator_vasp_id)
      .single();

    if (origVasp?.endpoint_url) {
      fetch(`${origVasp.endpoint_url}/transfer/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId,
          status: 'denied',
          result: 'denied',
          reasonType: denyReasonType,
          reasonMsg: denyReasonMsg,
        }),
      }).catch(err => {
        console.warn(`[Response] Deny callback to ${origVasp.vasp_entity_id} failed:`, err);
      });
    }
  }

  // 감사 로그
  await supabase.from('audit_log').insert({
    event_type: 'transfer.beneficiary_denied',
    entity_type: 'transfer',
    entity_id: transfer.id,
    details: {
      transfer_id: transferId,
      reason_type: denyReasonType,
      reason_msg: denyReasonMsg,
    },
  });

  return jsonResponse({
    result: 'denied',
    transferId,
    status: 'denied',
    reasonType: denyReasonType,
    reasonMsg: denyReasonMsg,
  });
}

// ============================================================
// 수신인 IVMS101 제공 (2차 교환) — Step 6
// ============================================================

async function handleBeneficiaryData(
  supabase: ReturnType<typeof createServiceClient>,
  body: Record<string, unknown>,
) {
  const { transferId, payload, beneficiaryInfo } = body;

  if (!transferId || (!payload && !beneficiaryInfo)) {
    return errorResponse(
      'INVALID_REQUEST',
      'Required: transferId + (payload or beneficiaryInfo)',
      400,
    );
  }

  const { data: transfer } = await supabase
    .from('transfers')
    .select('id, status, originator_vasp_id')
    .eq('transfer_id', transferId as string)
    .single();

  if (!transfer) {
    return errorResponse('TRANSFER_NOT_FOUND', `Transfer "${transferId}" not found`, 404);
  }

  // verified 상태에서만 2차 IVMS101 제공 가능
  if (transfer.status !== 'verified') {
    return errorResponse(
      'TRANSFER_INVALID_STATUS',
      `Cannot provide beneficiary data in "${transfer.status}" status. Must be "verified".`,
      400,
    );
  }

  // 상태 업데이트: verified → pending (2차 IVMS101 전달 중)
  await supabase
    .from('transfers')
    .update({
      status: 'pending',
      payload_encrypted: payload ? (payload as string) : undefined,
      ivms101_metadata: {
        beneficiary_data_provided: true,
        beneficiary_info: beneficiaryInfo ?? null,
        provided_at: new Date().toISOString(),
      },
    })
    .eq('id', transfer.id);

  // 송신 VASP에 2차 IVMS101 전달
  if (transfer.originator_vasp_id) {
    const { data: origVasp } = await supabase
      .from('vasps')
      .select('vasp_entity_id, endpoint_url')
      .eq('id', transfer.originator_vasp_id)
      .single();

    if (origVasp?.endpoint_url) {
      fetch(`${origVasp.endpoint_url}/transfer/ivms101`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId,
          payload: payload ?? null,
          beneficiaryInfo: beneficiaryInfo ?? null,
          stage: 'second_exchange',
        }),
      }).catch(err => {
        console.warn(`[Response] IVMS101 delivery to ${origVasp.vasp_entity_id} failed:`, err);
      });
    }
  }

  // 감사 로그
  await supabase.from('audit_log').insert({
    event_type: 'transfer.beneficiary_data_provided',
    entity_type: 'transfer',
    entity_id: transfer.id,
    details: {
      transfer_id: transferId,
      has_payload: !!payload,
      has_info: !!beneficiaryInfo,
    },
  });

  return jsonResponse({
    result: 'accepted',
    transferId,
    status: 'pending',
    message: 'Beneficiary IVMS101 data received. Forwarding to originator VASP.',
  });
}

// ============================================================
// 외부 Webhook 콜백 (Sumsub 등 비동기 응답)
// ============================================================

async function handleWebhook(
  supabase: ReturnType<typeof createServiceClient>,
  body: Record<string, unknown>,
  req: Request,
) {
  const source = (body.source as string) ?? 'unknown';

  console.log(`[Webhook] Received from ${source}:`, JSON.stringify(body).slice(0, 500));

  // Sumsub Webhook
  if (source === 'sumsub' || body.type === 'travelRule') {
    return await handleSumsubWebhook(supabase, body);
  }

  // CODE Webhook
  if (source === 'code' || body.allianceName === 'code') {
    return await handleCodeWebhook(supabase, body);
  }

  // 범용 Webhook (transferId + status)
  const transferId = (body.transferId as string) ?? (body.transfer_id as string);
  const status = (body.status as string) ?? (body.result as string);

  if (transferId && status) {
    return await handleGenericWebhook(supabase, transferId, status, body);
  }

  // 감사 로그 (미처리 webhook)
  await supabase.from('audit_log').insert({
    event_type: 'webhook.unhandled',
    entity_type: 'webhook',
    details: { source, body: JSON.stringify(body).slice(0, 1000) },
  });

  return jsonResponse({ received: true, processed: false, source });
}

// --- Sumsub Webhook ---
async function handleSumsubWebhook(
  supabase: ReturnType<typeof createServiceClient>,
  body: Record<string, unknown>,
) {
  const txnId = (body.txnId as string) ?? (body.externalTxnId as string);
  const status = (body.status as string) ?? (body.reviewResult as string);

  if (!txnId) {
    return jsonResponse({ received: true, processed: false, reason: 'No txnId' });
  }

  // Transfer 조회
  const { data: transfer } = await supabase
    .from('transfers')
    .select('id, status')
    .eq('transfer_id', txnId)
    .maybeSingle();

  if (!transfer) {
    return jsonResponse({ received: true, processed: false, reason: 'Transfer not found' });
  }

  // Sumsub 상태 → Hub 상태 매핑
  let newStatus = transfer.status;
  let result = '';

  if (status === 'completed' || status === 'approved') {
    newStatus = 'verified';
    result = 'verified';
  } else if (status === 'rejected' || status === 'declined') {
    newStatus = 'denied';
    result = 'denied';
  }

  if (newStatus !== transfer.status) {
    await supabase
      .from('transfers')
      .update({
        status: newStatus,
        result,
        reason_type: `SUMSUB_${status?.toUpperCase() ?? 'UNKNOWN'}`,
      })
      .eq('id', transfer.id);
  }

  await supabase.from('audit_log').insert({
    event_type: 'webhook.sumsub',
    entity_type: 'transfer',
    entity_id: transfer.id,
    details: { txnId, sumsub_status: status, new_status: newStatus },
  });

  return jsonResponse({ received: true, processed: true, transferId: txnId, status: newStatus });
}

// --- CODE Webhook ---
async function handleCodeWebhook(
  supabase: ReturnType<typeof createServiceClient>,
  body: Record<string, unknown>,
) {
  const transferId = body.transferId as string;
  const result = body.result as string;

  if (!transferId) {
    return jsonResponse({ received: true, processed: false, reason: 'No transferId' });
  }

  const { data: transfer } = await supabase
    .from('transfers')
    .select('id, status')
    .eq('transfer_id', transferId)
    .maybeSingle();

  if (!transfer) {
    return jsonResponse({ received: true, processed: false, reason: 'Transfer not found' });
  }

  const newStatus = result === 'verified' ? 'verified' : 'denied';

  if (newStatus !== transfer.status) {
    await supabase
      .from('transfers')
      .update({
        status: newStatus,
        result,
        reason_type: body.reasonType as string | undefined,
        reason_msg: body.reasonMsg as string | undefined,
      })
      .eq('id', transfer.id);
  }

  await supabase.from('audit_log').insert({
    event_type: 'webhook.code',
    entity_type: 'transfer',
    entity_id: transfer.id,
    details: { transferId, code_result: result },
  });

  return jsonResponse({ received: true, processed: true, transferId, status: newStatus });
}

// --- 범용 Webhook ---
async function handleGenericWebhook(
  supabase: ReturnType<typeof createServiceClient>,
  transferId: string,
  status: string,
  body: Record<string, unknown>,
) {
  const { data: transfer } = await supabase
    .from('transfers')
    .select('id, status')
    .eq('transfer_id', transferId)
    .maybeSingle();

  if (!transfer) {
    return jsonResponse({ received: true, processed: false, reason: 'Transfer not found' });
  }

  // 상태 매핑
  const statusMap: Record<string, string> = {
    verified: 'verified',
    confirmed: 'confirmed',
    denied: 'denied',
    rejected: 'denied',
    canceled: 'canceled',
  };

  const newStatus = statusMap[status] ?? status;

  await supabase
    .from('transfers')
    .update({
      status: newStatus,
      result: ['verified', 'confirmed'].includes(newStatus) ? 'verified' : 'denied',
    })
    .eq('id', transfer.id);

  await supabase.from('audit_log').insert({
    event_type: 'webhook.generic',
    entity_type: 'transfer',
    entity_id: transfer.id,
    details: { transferId, incoming_status: status, new_status: newStatus },
  });

  return jsonResponse({ received: true, processed: true, transferId, status: newStatus });
}

// ============================================================
// Helper: Transfer 응답 포맷
// ============================================================

function formatTransferResponse(t: Record<string, unknown>) {
  return {
    transferId: t.transfer_id,
    status: t.status,
    direction: t.direction,
    currency: t.currency,
    amount: t.amount,
    tradePrice: t.trade_price,
    tradeCurrency: t.trade_currency,
    isExceedingThreshold: t.is_exceeding_threshold,
    result: t.result,
    reasonType: t.reason_type,
    reasonMsg: t.reason_msg,
    txid: t.txid,
    originatorVasp: t.originator_vasp,
    beneficiaryVasp: t.beneficiary_vasp,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  };
}

/**
 * VASP Registry Edge Function
 * CODE VASP 호환 — VASP Discovery API
 * 
 * Endpoints:
 *   GET    /vasp-registry              → VASP 목록 조회 (필터: alliance, country, search)
 *   GET    /vasp-registry?id={id}      → 특정 VASP 조회
 *   GET    /vasp-registry?wallet={addr} → 지갑 주소 기반 VASP 탐색
 *   POST   /vasp-registry              → VASP 등록
 *   PUT    /vasp-registry              → VASP 정보 업데이트
 *   DELETE /vasp-registry?id={id}      → VASP 삭제
 * 
 * Sub-paths:
 *   POST   /vasp-registry/rotate-key     → 공개키 로테이션
 *   POST   /vasp-registry/address-verify → 수신인 검증
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase-client.ts';

// ============================================================
// Helpers
// ============================================================
function getSubPath(url: string): string {
  const u = new URL(url);
  const parts = u.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('vasp-registry');
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
    // POST Sub-paths (rotate-key, address-verify)
    // ========================================
    if (req.method === 'POST' && subPath) {
      const body = await req.json();

      if (subPath === 'rotate-key') {
        return await handleKeyRotation(supabase, body);
      }
      if (subPath === 'address-verify') {
        return await handleAddressVerify(supabase, body);
      }
      return errorResponse('NOT_FOUND', `Unknown sub-path: ${subPath}`, 404);
    }

    // ========================================
    // GET — VASP 목록 / 단일 / 지갑 탐색
    // ========================================
    if (req.method === 'GET') {
      const vaspId = url.searchParams.get('id');
      const wallet = url.searchParams.get('wallet');
      const alliance = url.searchParams.get('alliance');
      const country = url.searchParams.get('country');
      const search = url.searchParams.get('search');

      // 지갑 주소 기반 VASP 탐색
      if (wallet) {
        return await handleWalletSearch(supabase, wallet);
      }

      // 단일 VASP 조회
      if (vaspId) {
        const { data: vasp, error } = await supabase
          .from('vasps')
          .select(`*, public_keys (id, public_key, algorithm, expires_at, is_active, created_at)`)
          .eq('vasp_entity_id', vaspId)
          .single();

        if (error || !vasp) {
          return errorResponse('VASP_NOT_FOUND', `VASP "${vaspId}" not found`, 404);
        }
        return jsonResponse(vasp);
      }

      // VASP 목록 (필터 지원)
      let query = supabase
        .from('vasps')
        .select(`
          vasp_entity_id, vasp_name, vasp_legal_name,
          country_of_registration, alliance_name, health, channel_type,
          public_keys (public_key, expires_at)
        `)
        .order('vasp_name');

      if (alliance) query = query.eq('alliance_name', alliance);
      if (country) query = query.eq('country_of_registration', country);
      if (search) query = query.or(`vasp_name.ilike.%${search}%,vasp_legal_name.ilike.%${search}%`);

      const { data: vasps, error } = await query;
      if (error) throw error;

      return jsonResponse({
        vasps: (vasps ?? []).map((v: Record<string, unknown>) => ({
          vaspEntityId: v.vasp_entity_id,
          vaspName: v.vasp_name,
          vaspLegalName: v.vasp_legal_name,
          countryOfRegistration: v.country_of_registration,
          allianceName: v.alliance_name,
          health: v.health,
          channelType: v.channel_type,
          pubkeys: ((v.public_keys as Array<Record<string, unknown>>) ?? []).map(
            (pk: Record<string, unknown>) => ({ pubkey: pk.public_key, expiresAt: pk.expires_at })
          ),
        })),
        total: (vasps ?? []).length,
      });
    }

    // ========================================
    // POST — VASP 등록
    // ========================================
    if (req.method === 'POST') {
      const body = await req.json();
      const {
        vasp_entity_id, vasp_name, vasp_legal_name,
        country_of_registration, alliance_name = 'transight',
        endpoint_url, channel_type = 'HTTPS',
        public_key, public_key_expires_at,
      } = body;

      if (!vasp_entity_id || !vasp_name || !country_of_registration || !endpoint_url || !public_key) {
        return errorResponse('INVALID_REQUEST', 'Required: vasp_entity_id, vasp_name, country_of_registration, endpoint_url, public_key', 400);
      }

      const { data: vasp, error: vaspError } = await supabase
        .from('vasps')
        .insert({ vasp_entity_id, vasp_name, vasp_legal_name, country_of_registration, alliance_name, endpoint_url, channel_type })
        .select().single();

      if (vaspError) {
        if (vaspError.code === '23505') return errorResponse('VASP_DUPLICATE', `VASP "${vasp_entity_id}" already exists`, 409);
        throw vaspError;
      }

      await supabase.from('public_keys').insert({ vasp_id: vasp.id, public_key, algorithm: 'Ed25519', expires_at: public_key_expires_at || null, is_active: true });
      await supabase.from('audit_log').insert({ event_type: 'vasp.registered', entity_type: 'vasp', entity_id: vasp.id, details: { vasp_entity_id, alliance_name, channel_type } });

      return jsonResponse({ success: true, vasp }, 201);
    }

    // ========================================
    // PUT — VASP 업데이트
    // ========================================
    if (req.method === 'PUT') {
      const body = await req.json();
      const { vasp_entity_id, ...updates } = body;
      if (!vasp_entity_id) return errorResponse('INVALID_REQUEST', 'Required: vasp_entity_id', 400);

      const allowedFields = ['vasp_name', 'vasp_legal_name', 'endpoint_url', 'channel_type', 'health', 'metadata'];
      const safeUpdates: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if (key in updates) safeUpdates[key] = updates[key];
      }
      if (Object.keys(safeUpdates).length === 0) return errorResponse('INVALID_REQUEST', 'No valid fields to update', 400);

      const { data: vasp, error } = await supabase.from('vasps').update(safeUpdates).eq('vasp_entity_id', vasp_entity_id).select().single();
      if (error || !vasp) return errorResponse('VASP_NOT_FOUND', `VASP "${vasp_entity_id}" not found`, 404);

      await supabase.from('audit_log').insert({ event_type: 'vasp.updated', entity_type: 'vasp', entity_id: vasp.id, details: { vasp_entity_id, updated_fields: Object.keys(safeUpdates) } });
      return jsonResponse({ success: true, vasp });
    }

    // ========================================
    // DELETE — VASP 삭제
    // ========================================
    if (req.method === 'DELETE') {
      const vaspId = url.searchParams.get('id');
      if (!vaspId) return errorResponse('INVALID_REQUEST', 'Query param "id" is required', 400);

      const { data: vasp } = await supabase.from('vasps').select('id').eq('vasp_entity_id', vaspId).single();
      if (!vasp) return errorResponse('VASP_NOT_FOUND', `VASP "${vaspId}" not found`, 404);

      await supabase.from('vasps').delete().eq('id', vasp.id);
      await supabase.from('audit_log').insert({ event_type: 'vasp.deleted', entity_type: 'vasp', entity_id: vasp.id, details: { vasp_entity_id: vaspId } });

      return jsonResponse({ success: true, deleted: vaspId });
    }

    return errorResponse('METHOD_NOT_ALLOWED', `${req.method} not allowed`, 405);

  } catch (error) {
    console.error('VASP Registry error:', error);
    return errorResponse('INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', 500);
  }
});

// ============================================================
// 공개키 로테이션
// ============================================================
async function handleKeyRotation(
  supabase: ReturnType<typeof createServiceClient>,
  body: Record<string, unknown>
) {
  const { vasp_entity_id, new_public_key, expires_at } = body;
  if (!vasp_entity_id || !new_public_key) return errorResponse('INVALID_REQUEST', 'Required: vasp_entity_id, new_public_key', 400);

  const { data: vasp } = await supabase.from('vasps').select('id').eq('vasp_entity_id', vasp_entity_id as string).single();
  if (!vasp) return errorResponse('VASP_NOT_FOUND', `VASP "${vasp_entity_id}" not found`, 404);

  // 기존 키 비활성화
  await supabase.from('public_keys').update({ is_active: false }).eq('vasp_id', vasp.id).eq('is_active', true);

  // 새 키 등록
  const { data: newKey } = await supabase.from('public_keys')
    .insert({ vasp_id: vasp.id, public_key: new_public_key, algorithm: 'Ed25519', expires_at: (expires_at as string) ?? null, is_active: true })
    .select().single();

  await supabase.from('audit_log').insert({ event_type: 'public_key.rotated', entity_type: 'public_key', entity_id: vasp.id, details: { vasp_entity_id } });

  return jsonResponse({ success: true, vasp_entity_id, new_key: newKey });
}

// ============================================================
// 수신인 검증
// ============================================================
async function handleAddressVerify(
  supabase: ReturnType<typeof createServiceClient>,
  body: Record<string, unknown>
) {
  const { address, currency, beneficiaryVaspEntityId } = body;
  if (!address || !currency) return errorResponse('INVALID_REQUEST', 'Required: address, currency', 400);

  if (beneficiaryVaspEntityId) {
    const { data: vasp } = await supabase.from('vasps').select('vasp_entity_id, vasp_name, health').eq('vasp_entity_id', beneficiaryVaspEntityId as string).single();
    if (!vasp) return jsonResponse({ verified: false, reason: 'VASP_NOT_FOUND', address, currency });

    // TODO: Phase 4에서 실제 수신 VASP에 검증 API 호출
    return jsonResponse({ verified: true, address, currency, vasp: { vaspEntityId: vasp.vasp_entity_id, vaspName: vasp.vasp_name, health: vasp.health } });
  }

  return jsonResponse({ verified: false, reason: 'VASP_NOT_SPECIFIED', message: 'Please specify beneficiaryVaspEntityId', address, currency });
}

// ============================================================
// 지갑 주소 기반 VASP 탐색
// ============================================================
async function handleWalletSearch(
  supabase: ReturnType<typeof createServiceClient>,
  wallet: string
) {
  const { data: transfers } = await supabase
    .from('transfers')
    .select('beneficiary_vasp_id, originator_vasp_id, ivms101_metadata')
    .or(`ivms101_metadata->>address.eq.${wallet}`)
    .limit(5);

  if (!transfers || transfers.length === 0) {
    return jsonResponse({ found: false, wallet, candidates: [] });
  }

  const vaspIds = new Set<string>();
  for (const t of transfers) {
    if (t.beneficiary_vasp_id) vaspIds.add(t.beneficiary_vasp_id);
    if (t.originator_vasp_id) vaspIds.add(t.originator_vasp_id);
  }

  const { data: vasps } = await supabase.from('vasps').select('vasp_entity_id, vasp_name, alliance_name, health').in('id', Array.from(vaspIds));

  return jsonResponse({
    found: true,
    wallet,
    candidates: (vasps ?? []).map((v: Record<string, unknown>) => ({
      vaspEntityId: v.vasp_entity_id,
      vaspName: v.vasp_name,
      allianceName: v.alliance_name,
      health: v.health,
    })),
  });
}

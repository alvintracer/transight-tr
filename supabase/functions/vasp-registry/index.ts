/**
 * VASP Registry Edge Function
 * CODE VASP 호환 — VASP Discovery API
 * 
 * Endpoints:
 *   GET  /vasp-registry              → VASP 목록 조회 (CODE: GET /v1/code/vasps)
 *   GET  /vasp-registry?id={id}      → 특정 VASP 조회
 *   POST /vasp-registry              → VASP 등록 (TranSight 확장)
 *   GET  /vasp-registry?wallet={addr} → 지갑 기반 VASP 탐색
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase-client.ts';

serve(async (req: Request) => {
  // CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const supabase = createServiceClient();
  const url = new URL(req.url);

  try {
    // ========================================
    // GET — VASP 목록 / 단일 조회
    // ========================================
    if (req.method === 'GET') {
      const vaspId = url.searchParams.get('id');

      // 단일 VASP 조회
      if (vaspId) {
        const { data: vasp, error } = await supabase
          .from('vasps')
          .select(`
            *,
            public_keys (
              id, public_key, algorithm, expires_at, is_active, created_at
            )
          `)
          .eq('vasp_entity_id', vaspId)
          .single();

        if (error || !vasp) {
          return new Response(
            JSON.stringify({ error: 'VASP not found', vaspEntityId: vaspId }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }

        return new Response(JSON.stringify(vasp), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // VASP 목록 (CODE 호환 형식)
      const { data: vasps, error } = await supabase
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
            expires_at
          )
        `)
        .order('vasp_name');

      if (error) {
        throw error;
      }

      // CODE VASP 호환 응답 형식으로 변환
      const codeCompatResponse = {
        vasps: (vasps ?? []).map((v: Record<string, unknown>) => ({
          vaspEntityId: v.vasp_entity_id,
          vaspName: v.vasp_name,
          vaspLegalName: v.vasp_legal_name,
          countryOfRegistration: v.country_of_registration,
          allianceName: v.alliance_name,
          health: v.health,
          pubkeys: ((v.public_keys as Array<Record<string, unknown>>) ?? []).map(
            (pk: Record<string, unknown>) => ({
              pubkey: pk.public_key,
              expiresAt: pk.expires_at,
            })
          ),
        })),
      };

      return new Response(JSON.stringify(codeCompatResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========================================
    // POST — VASP 등록 (TranSight 확장)
    // ========================================
    if (req.method === 'POST') {
      const body = await req.json();

      const {
        vasp_entity_id,
        vasp_name,
        vasp_legal_name,
        country_of_registration,
        alliance_name = 'transight',
        endpoint_url,
        channel_type = 'HTTPS',
        public_key,
        public_key_expires_at,
      } = body;

      // 필수 필드 검증
      if (!vasp_entity_id || !vasp_name || !country_of_registration || !endpoint_url || !public_key) {
        return new Response(
          JSON.stringify({
            error: 'Missing required fields',
            required: ['vasp_entity_id', 'vasp_name', 'country_of_registration', 'endpoint_url', 'public_key'],
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // VASP 등록
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
        })
        .select()
        .single();

      if (vaspError) {
        if (vaspError.code === '23505') {
          return new Response(
            JSON.stringify({ error: 'VASP entity ID already exists', vasp_entity_id }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
        throw vaspError;
      }

      // 공개키 등록
      const { error: keyError } = await supabase
        .from('public_keys')
        .insert({
          vasp_id: vasp.id,
          public_key,
          algorithm: 'Ed25519',
          expires_at: public_key_expires_at || null,
          is_active: true,
        });

      if (keyError) throw keyError;

      // 감사 로그
      await supabase.from('audit_log').insert({
        event_type: 'vasp.registered',
        entity_type: 'vasp',
        entity_id: vasp.id,
        details: { vasp_entity_id, alliance_name, channel_type },
      });

      return new Response(JSON.stringify({ success: true, vasp }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 지원하지 않는 메서드
    return new Response(
      JSON.stringify({ error: `Method ${req.method} not allowed` }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (error) {
    console.error('VASP Registry error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

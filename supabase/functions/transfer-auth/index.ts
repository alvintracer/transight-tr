/**
 * Transfer Authorization Edge Function (Skeleton)
 * CODE VASP 호환 — Asset Transfer Authorization API
 * 
 * Endpoints:
 *   POST /transfer-auth             → 출금 TR 요청 (Originator → Hub → Beneficiary)
 *   POST /transfer-auth/incoming    → 입금 TR 수신 (Beneficiary 측)
 *   GET  /transfer-auth?id={id}     → Transfer 상태 조회
 * 
 * 핵심 흐름 (Atomic KYT + TR):
 *   1. KYT 조회 → BLOCK이면 즉시 종료
 *   2. KYT PASS → 수신 VASP에 1차 IVMS101 전달
 *   3. 수신 VASP 확인 → MATCHED / NOT_MATCHED
 *   4. 2차 IVMS101 교환
 * 
 * TODO: Phase 3에서 완전 구현 예정
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
    // GET — Transfer 상태 조회
    // ========================================
    if (req.method === 'GET') {
      const transferId = url.searchParams.get('id');

      if (!transferId) {
        return new Response(
          JSON.stringify({ error: 'Transfer ID is required (query param: id)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      const { data: transfer, error } = await supabase
        .from('transfers')
        .select('transfer_id, status, direction, currency, amount, result, reason_type, reason_msg, txid, created_at, updated_at')
        .eq('transfer_id', transferId)
        .single();

      if (error || !transfer) {
        return new Response(
          JSON.stringify({ error: 'Transfer not found', transferId }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // CODE 호환 응답
      return new Response(
        JSON.stringify({
          transferId: transfer.transfer_id,
          status: transfer.status,
          txid: transfer.txid,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ========================================
    // POST — Transfer Authorization 요청
    // ========================================
    if (req.method === 'POST') {
      const body = await req.json();

      // TODO: Phase 3에서 구현할 항목들
      // 1. CODE VASP 헤더 서명 검증
      // 2. 요청 본문 파싱 (AssetTransferAuthRequest)
      // 3. KYT 조회 (Atomic Gate 1)
      //    - KYT BLOCK → 즉시 denied 응답 + PII 전송 차단
      //    - KYT PASS → 계속 진행
      // 4. 수신 VASP 탐색 (Protocol Adapter Layer)
      //    - CODE 호환 VASP → CODE 프로토콜로 전달
      //    - VV VASP → VerifyVASP 프로토콜로 전달
      //    - 은행 → 전용선/전문으로 브릿징
      // 5. 수신 VASP에 1차 IVMS101 전달
      // 6. 응답 수신 → Transfer 상태 업데이트
      // 7. 감사 로그 기록

      // Skeleton: Transfer 레코드 생성만
      const {
        transferId,
        currency,
        amount,
        tradePrice,
        tradeCurrency = 'KRW',
        isExceedingThreshold = false,
        payload,
      } = body;

      if (!transferId || !currency || !amount || !payload) {
        return new Response(
          JSON.stringify({
            error: 'Missing required fields',
            required: ['transferId', 'currency', 'amount', 'payload'],
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Transfer 레코드 생성
      const { data: transfer, error } = await supabase
        .from('transfers')
        .insert({
          transfer_id: transferId,
          status: 'wait',
          direction: 'outgoing',
          currency,
          amount,
          trade_price: tradePrice,
          trade_currency: tradeCurrency,
          is_exceeding_threshold: isExceedingThreshold,
          payload_encrypted: payload,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return new Response(
            JSON.stringify({ error: 'Duplicate transferId', transferId }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }
        throw error;
      }

      // Skeleton 응답 (Phase 3에서 실제 인가 흐름으로 교체)
      return new Response(
        JSON.stringify({
          result: 'verified',  // TODO: 실제 수신 VASP 응답 반영
          reasonType: '',
          reasonMsg: '',
          transferId: transfer.transfer_id,
          beneficiaryVasp: {},
          payload: '',  // TODO: 수신 VASP의 암호화된 응답 payload
          _notice: 'SKELETON — Phase 3에서 실제 인가 흐름 구현 예정',
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(
      JSON.stringify({ error: `Method ${req.method} not allowed` }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (error) {
    console.error('Transfer Auth error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

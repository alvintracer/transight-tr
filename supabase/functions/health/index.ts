/**
 * Health Check Edge Function
 * CODE VASP 호환 — GET /health
 * 
 * 다른 VASP가 TranSight Hub의 상태를 확인하는 엔드포인트
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase-client.ts';

serve(async (req: Request) => {
  // CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // DB 연결 확인
    const supabase = createServiceClient();
    const { count, error } = await supabase
      .from('vasps')
      .select('*', { count: 'exact', head: true });

    const dbStatus = error ? 'down' : 'up';

    const response = {
      status: dbStatus === 'up' ? 'up' : 'down',
      timestamp: new Date().toISOString(),
      service: 'TranSight Hub',
      version: '0.1.0',
      components: {
        database: dbStatus,
        vasps_registered: count ?? 0,
      },
    };

    return new Response(JSON.stringify(response), {
      status: dbStatus === 'up' ? 200 : 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'down',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});

/**
 * CORS 헤더 유틸리티 (Edge Functions 공유)
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, ' +
    'x-code-req-datetime, x-code-req-nonce, x-code-req-pubkey, ' +
    'x-code-req-remote-pubkey, x-code-req-signature, x-request-origin',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * CORS preflight 응답 생성
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

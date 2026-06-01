/**
 * 감사 로그 서비스
 * 규제 준수를 위한 이벤트 기록 + 조회
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Types
// ============================================================

export interface AuditLogEntry {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id?: string;
  actor_vasp_id?: string;
  details: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface AuditLogFilter {
  event_type?: string;
  entity_type?: string;
  entity_id?: string;
  from?: string;  // ISO8601
  to?: string;    // ISO8601
  limit?: number;
  offset?: number;
}

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
// Audit Log Operations
// ============================================================

/**
 * 감사 로그 기록
 */
export async function logEvent(
  eventType: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>,
  actorVaspId?: string,
  ipAddress?: string
): Promise<void> {
  const supabase = getServiceClient();

  await supabase.from('audit_log').insert({
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    actor_vasp_id: actorVaspId,
    details: details ?? {},
    ip_address: ipAddress,
  });
}

/**
 * 감사 로그 조회 (필터 + 페이지네이션)
 */
export async function queryAuditLog(
  filter?: AuditLogFilter
): Promise<{ data: AuditLogEntry[]; count: number }> {
  const supabase = getServiceClient();

  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filter?.event_type) {
    query = query.eq('event_type', filter.event_type);
  }
  if (filter?.entity_type) {
    query = query.eq('entity_type', filter.entity_type);
  }
  if (filter?.entity_id) {
    query = query.eq('entity_id', filter.entity_id);
  }
  if (filter?.from) {
    query = query.gte('created_at', filter.from);
  }
  if (filter?.to) {
    query = query.lte('created_at', filter.to);
  }

  const limit = filter?.limit ?? 50;
  const offset = filter?.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Audit log query failed: ${error.message}`);

  return {
    data: (data ?? []) as AuditLogEntry[],
    count: count ?? 0,
  };
}

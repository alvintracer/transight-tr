/**
 * Transfer 서비스 레이어
 * Transfer CRUD + 상태 관리 + TTL Queue
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
  TransferStatus,
  TransferDirection,
  isValidTransition,
  type TransferRecord,
} from '../types/transfer.js';
import type {
  AssetTransferAuthRequest,
  AssetTransferAuthResponse,
} from '../types/code-api.js';

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
// Transfer CRUD
// ============================================================

/** Transfer 생성 입력 */
export interface CreateTransferInput {
  transferId?: string;
  direction: TransferDirection;
  originatorVaspEntityId?: string;
  beneficiaryVaspEntityId?: string;
  currency: string;
  amount: string;
  tradePrice?: string;
  tradeCurrency?: string;
  isExceedingThreshold?: boolean;
  payloadEncrypted?: string;
  ivms101Metadata?: Record<string, unknown>;
}

/**
 * Transfer 레코드 생성
 */
export async function createTransfer(input: CreateTransferInput): Promise<TransferRecord> {
  const supabase = getServiceClient();

  // VASP ID 조회 (entity_id → UUID)
  let originatorVaspId: string | undefined;
  let beneficiaryVaspId: string | undefined;

  if (input.originatorVaspEntityId) {
    const { data } = await supabase
      .from('vasps')
      .select('id')
      .eq('vasp_entity_id', input.originatorVaspEntityId)
      .single();
    originatorVaspId = data?.id;
  }

  if (input.beneficiaryVaspEntityId) {
    const { data } = await supabase
      .from('vasps')
      .select('id')
      .eq('vasp_entity_id', input.beneficiaryVaspEntityId)
      .single();
    beneficiaryVaspId = data?.id;
  }

  const transferId = input.transferId ?? uuidv4();

  const { data, error } = await supabase
    .from('transfers')
    .insert({
      transfer_id: transferId,
      status: TransferStatus.WAIT,
      direction: input.direction,
      originator_vasp_id: originatorVaspId,
      beneficiary_vasp_id: beneficiaryVaspId,
      currency: input.currency,
      amount: input.amount,
      trade_price: input.tradePrice,
      trade_currency: input.tradeCurrency ?? 'KRW',
      is_exceeding_threshold: input.isExceedingThreshold ?? false,
      payload_encrypted: input.payloadEncrypted,
      ivms101_metadata: input.ivms101Metadata ?? {},
    })
    .select()
    .single();

  if (error) throw new Error(`Transfer creation failed: ${error.message}`);

  // 감사 로그
  await supabase.from('audit_log').insert({
    event_type: 'transfer.created',
    entity_type: 'transfer',
    entity_id: data.id,
    details: {
      transfer_id: transferId,
      direction: input.direction,
      currency: input.currency,
      amount: input.amount,
    },
  });

  return data as TransferRecord;
}

/**
 * Transfer ID로 조회
 */
export async function getTransferByTransferId(transferId: string): Promise<TransferRecord | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('transfers')
    .select('*')
    .eq('transfer_id', transferId)
    .single();

  if (error || !data) return null;
  return data as TransferRecord;
}

/**
 * Transfer 상태 변경 (상태 머신 규칙 검증 포함)
 */
export async function updateTransferStatus(
  transferId: string,
  newStatus: TransferStatus,
  additionalFields?: Partial<Pick<TransferRecord, 'result' | 'reason_type' | 'reason_msg' | 'txid' | 'payload_encrypted' | 'kyt_result'>>
): Promise<TransferRecord> {
  const supabase = getServiceClient();

  // 현재 상태 조회
  const current = await getTransferByTransferId(transferId);
  if (!current) throw new Error(`Transfer not found: ${transferId}`);

  // 상태 전이 검증
  const currentStatus = current.status as TransferStatus;
  if (!isValidTransition(currentStatus, newStatus)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} → ${newStatus} for transfer ${transferId}`
    );
  }

  // 업데이트
  const updateData: Record<string, unknown> = {
    status: newStatus,
    ...additionalFields,
  };

  const { data, error } = await supabase
    .from('transfers')
    .update(updateData)
    .eq('transfer_id', transferId)
    .select()
    .single();

  if (error) throw new Error(`Status update failed: ${error.message}`);

  // 감사 로그
  await supabase.from('audit_log').insert({
    event_type: 'transfer.status_changed',
    entity_type: 'transfer',
    entity_id: data.id,
    details: {
      transfer_id: transferId,
      from: currentStatus,
      to: newStatus,
      result: additionalFields?.result,
    },
  });

  return data as TransferRecord;
}

/**
 * Transfer 목록 조회 (필터 지원)
 */
export async function listTransfers(options?: {
  direction?: TransferDirection;
  status?: TransferStatus;
  vaspEntityId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: TransferRecord[]; count: number }> {
  const supabase = getServiceClient();

  let query = supabase
    .from('transfers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (options?.direction) {
    query = query.eq('direction', options.direction);
  }
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 20) - 1);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(`Transfer list failed: ${error.message}`);

  return {
    data: (data ?? []) as TransferRecord[],
    count: count ?? 0,
  };
}

// ============================================================
// TTL Queue (에스크로 매칭)
// ============================================================

/**
 * TTL Queue에 항목 추가 (입금 감지 시)
 */
export async function addToTtlQueue(
  matchKey: string,
  transferId: string,
  transferData: Record<string, unknown>,
  ttlSeconds = 3600
): Promise<void> {
  const supabase = getServiceClient();

  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  // Transfer 내부 ID 조회
  const { data: transfer } = await supabase
    .from('transfers')
    .select('id')
    .eq('transfer_id', transferId)
    .single();

  const { error } = await supabase.from('ttl_queue').insert({
    match_key: matchKey,
    transfer_id: transfer?.id,
    transfer_data: transferData,
    ttl_seconds: ttlSeconds,
    expires_at: expiresAt,
  });

  if (error) throw new Error(`TTL Queue insert failed: ${error.message}`);
}

/**
 * TTL Queue에서 매칭 키로 검색 (미매칭 + 미만료)
 */
export async function findInTtlQueue(matchKey: string): Promise<{
  id: string;
  transfer_id: string;
  transfer_data: Record<string, unknown>;
} | null> {
  const supabase = getServiceClient();

  const { data } = await supabase
    .from('ttl_queue')
    .select('id, transfer_id, transfer_data')
    .eq('match_key', matchKey)
    .eq('matched', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  return data ?? null;
}

/**
 * TTL Queue 항목 매칭 완료 처리
 */
export async function markTtlQueueMatched(queueId: string): Promise<void> {
  const supabase = getServiceClient();

  const { error } = await supabase
    .from('ttl_queue')
    .update({
      matched: true,
      matched_at: new Date().toISOString(),
    })
    .eq('id', queueId);

  if (error) throw new Error(`TTL Queue match failed: ${error.message}`);
}

/**
 * 만료된 TTL Queue 항목 정리
 */
export async function cleanExpiredTtlQueue(): Promise<number> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('ttl_queue')
    .delete()
    .eq('matched', false)
    .lt('expires_at', new Date().toISOString())
    .select('id');

  if (error) throw new Error(`TTL Queue cleanup failed: ${error.message}`);
  return data?.length ?? 0;
}

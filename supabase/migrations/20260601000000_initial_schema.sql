-- ==========================================================
-- TranSight TR — Initial Database Schema
-- CODE VASP 호환 + TranSight 확장
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- 1. vasps — VASP 레지스트리
-- ==========================================================
CREATE TABLE vasps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vasp_entity_id TEXT UNIQUE NOT NULL,        -- CODE: vaspEntityId (고유 식별자)
  vasp_name TEXT NOT NULL,                    -- CODE: vaspName (표시 이름)
  vasp_legal_name TEXT,                       -- CODE: vaspLegalName (법적 등록명)
  country_of_registration TEXT,               -- ISO 3166-1 alpha-2 (e.g., 'KR')
  alliance_name TEXT NOT NULL DEFAULT 'transight',  -- code | verifyvasp | transight | sumsub | direct
  endpoint_url TEXT,                          -- TR API 엔드포인트 URL
  channel_type TEXT NOT NULL DEFAULT 'HTTPS', -- HTTPS | mTLS | VPN | LEASED_LINE
  health TEXT NOT NULL DEFAULT 'up',          -- up | down
  metadata JSONB DEFAULT '{}',               -- 추가 메타데이터
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_vasps_entity_id ON vasps(vasp_entity_id);
CREATE INDEX idx_vasps_alliance ON vasps(alliance_name);
CREATE INDEX idx_vasps_health ON vasps(health);

-- ==========================================================
-- 2. public_keys — VASP 공개키 관리
-- ==========================================================
CREATE TABLE public_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vasp_id UUID NOT NULL REFERENCES vasps(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,                   -- Base64 Ed25519 verify key
  algorithm TEXT NOT NULL DEFAULT 'Ed25519',
  expires_at TIMESTAMPTZ,                     -- 만료 시각 (NULL = 무기한)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_public_keys_vasp_id ON public_keys(vasp_id);
CREATE INDEX idx_public_keys_active ON public_keys(vasp_id, is_active) WHERE is_active = true;

-- ==========================================================
-- 3. transfers — Travel Rule 전송 메시지
-- ==========================================================
CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id TEXT UNIQUE NOT NULL,           -- UUID v4 (CODE transferId)
  status TEXT NOT NULL DEFAULT 'wait',        -- wait|verified|denied|pending|processing|wait-confirmed|confirmed|canceled
  direction TEXT NOT NULL,                    -- outgoing | incoming
  originator_vasp_id UUID REFERENCES vasps(id),
  beneficiary_vasp_id UUID REFERENCES vasps(id),
  currency TEXT NOT NULL,                     -- 가상자산 심볼 (BTC, ETH, ...)
  amount TEXT NOT NULL,                       -- 전송 수량
  trade_price TEXT,                           -- 법정화폐 환산 금액
  trade_currency TEXT DEFAULT 'KRW',          -- ISO 4217 (KRW, USD, ...)
  is_exceeding_threshold BOOLEAN DEFAULT false, -- 트래블룰 임계값 초과 여부
  payload_encrypted TEXT,                     -- 암호화된 IVMS101 payload (Base64)
  ivms101_metadata JSONB DEFAULT '{}',        -- Hub 접근 가능 메타데이터
  -- Hub가 볼 수 있는 것: walletAddress, amount, vaspId, trMessageId
  -- Hub가 못 보는 것: originator.name, dateOfBirth (ECIES/NaCl 암호화)
  result TEXT,                                -- verified | denied
  reason_type TEXT,                           -- 거부 사유 코드
  reason_msg TEXT,                            -- 거부 사유 메시지
  txid TEXT,                                  -- 온체인 TX Hash
  vout TEXT,                                  -- UTXO vout index
  kyt_result JSONB DEFAULT '{}',              -- KYT 연동 결과
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_transfers_transfer_id ON transfers(transfer_id);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_direction ON transfers(direction);
CREATE INDEX idx_transfers_originator ON transfers(originator_vasp_id);
CREATE INDEX idx_transfers_beneficiary ON transfers(beneficiary_vasp_id);
CREATE INDEX idx_transfers_txid ON transfers(txid) WHERE txid IS NOT NULL;
CREATE INDEX idx_transfers_created ON transfers(created_at);

-- 상태 체크 제약
ALTER TABLE transfers ADD CONSTRAINT chk_transfer_status
  CHECK (status IN ('wait', 'verified', 'denied', 'pending', 'processing', 'wait-confirmed', 'confirmed', 'canceled'));

ALTER TABLE transfers ADD CONSTRAINT chk_transfer_direction
  CHECK (direction IN ('outgoing', 'incoming'));

-- ==========================================================
-- 4. ttl_queue — TTL 에스크로 매칭
-- 온체인 입금 감지 ↔ TR 메시지 비동기 매칭
-- ==========================================================
CREATE TABLE ttl_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_key TEXT NOT NULL,                    -- 매칭 키 (wallet_address:currency:amount 등)
  transfer_id UUID REFERENCES transfers(id),
  transfer_data JSONB NOT NULL,               -- 매칭에 필요한 데이터
  ttl_seconds INTEGER NOT NULL DEFAULT 3600,  -- 기본 1시간
  matched BOOLEAN NOT NULL DEFAULT false,
  matched_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_ttl_queue_match_key ON ttl_queue(match_key);
CREATE INDEX idx_ttl_queue_unmatched ON ttl_queue(matched, expires_at) WHERE matched = false;
CREATE INDEX idx_ttl_queue_transfer ON ttl_queue(transfer_id);

-- ==========================================================
-- 5. audit_log — 감사 로그 (규제 준수)
-- ==========================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,                   -- transfer.created, transfer.status_changed, vasp.registered, ...
  entity_type TEXT NOT NULL,                  -- transfer | vasp | public_key
  entity_id UUID,
  actor_vasp_id UUID REFERENCES vasps(id),
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_event ON audit_log(event_type);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ==========================================================
-- 6. updated_at 자동 갱신 트리거
-- ==========================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vasps_updated_at
  BEFORE UPDATE ON vasps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_transfers_updated_at
  BEFORE UPDATE ON transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- 7. Row Level Security (RLS)
-- ==========================================================
ALTER TABLE vasps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ttl_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Service Role은 모든 접근 허용 (Edge Functions에서 사용)
CREATE POLICY "Service role full access" ON vasps
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON public_keys
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON transfers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON ttl_queue
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON audit_log
  FOR ALL USING (auth.role() = 'service_role');

-- Anon users: VASP 목록 읽기만 허용
CREATE POLICY "Public read vasps" ON vasps
  FOR SELECT USING (true);

CREATE POLICY "Public read public_keys" ON public_keys
  FOR SELECT USING (true);

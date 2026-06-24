-- ==========================================================
-- TranSight TR — GTR Adapter Schema
-- GTR VASP 프로필 + GTR 전송 로그
-- ==========================================================

-- ==========================================================
-- 1. gtr_vasp_profiles — GTR VASP별 설정/메타데이터
-- ==========================================================
CREATE TABLE gtr_vasp_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vasp_id UUID NOT NULL REFERENCES vasps(id) ON DELETE CASCADE,

  -- GTR 네트워크 정보
  gtr_vasp_code TEXT NOT NULL,                        -- GTR 내 VASP 코드 (예: 'BNC001')
  gtr_legal_entity_name TEXT,                         -- GTR 등록 법인명
  gtr_display_name TEXT,                              -- GTR 표시명
  jurisdiction TEXT,                                  -- GTR 관할권

  -- GTR E2E 암호화 키 (Curve25519)
  target_public_key TEXT,                             -- 상대 VASP Curve25519 공개키
  target_public_key_algorithm TEXT DEFAULT 'curve25519',
  target_public_key_expires_at TIMESTAMPTZ,

  -- 지원 기능
  support_pre_transaction BOOLEAN DEFAULT true,       -- Pre-transaction 검증 지원
  support_post_transaction BOOLEAN DEFAULT false,     -- Post-transaction 검증 지원

  -- PII 검증 필드
  pii_verification_support TEXT[] DEFAULT '{}',       -- 지원하는 검증 필드 코드
  expected_pii_preferences TEXT[] DEFAULT '{}',       -- 선호하는 검증 필드

  -- 추가 기능
  address_verification_supported BOOLEAN DEFAULT false,
  txid_verification_supported BOOLEAN DEFAULT false,

  -- 상태
  status TEXT NOT NULL DEFAULT 'active',              -- active | pending | disabled
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(gtr_vasp_code)
);

-- 인덱스
CREATE INDEX idx_gtr_profiles_vasp_id ON gtr_vasp_profiles(vasp_id);
CREATE INDEX idx_gtr_profiles_vasp_code ON gtr_vasp_profiles(gtr_vasp_code);
CREATE INDEX idx_gtr_profiles_status ON gtr_vasp_profiles(status);

-- ==========================================================
-- 2. gtr_transfer_logs — GTR 전송 로그 (PII 미포함)
-- ==========================================================
CREATE TABLE gtr_transfer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,

  -- GTR 요청/응답 식별자
  gtr_request_id TEXT NOT NULL,                       -- TTR-{transferId}
  gtr_travelrule_id TEXT,                             -- GTR 발급 travelruleId

  -- 라우팅 정보
  target_vasp_code TEXT NOT NULL,                     -- GTR VASP 코드

  -- 검증 결과
  verify_direction INTEGER,                           -- GTR verifyDirection (1=Post, 2=Pre)
  verify_status INTEGER,                              -- GTR verifyStatus 코드 (100000=성공 등)
  verify_message TEXT,                                -- GTR verifyMessage
  verify_fields JSONB DEFAULT '[]',                   -- 각 필드별 검증 결과

  -- 보안: payload 해시만 저장 (원문/암호문 미저장)
  request_payload_hash TEXT,                          -- SHA-256(encryptedPayload)
  response_payload_hash TEXT,                         -- SHA-256(responsePayload)

  -- 성능/오류 추적
  latency_ms INTEGER,
  http_status INTEGER,
  error_code TEXT,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_gtr_logs_transfer_id ON gtr_transfer_logs(transfer_id);
CREATE INDEX idx_gtr_logs_request_id ON gtr_transfer_logs(gtr_request_id);
CREATE INDEX idx_gtr_logs_target_vasp ON gtr_transfer_logs(target_vasp_code);
CREATE INDEX idx_gtr_logs_created ON gtr_transfer_logs(created_at);

-- ==========================================================
-- 3. RLS 정책
-- ==========================================================
ALTER TABLE gtr_vasp_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtr_transfer_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON gtr_vasp_profiles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON gtr_transfer_logs
  FOR ALL USING (auth.role() = 'service_role');

-- ==========================================================
-- 4. updated_at 자동 갱신 트리거 (gtr_vasp_profiles)
-- ==========================================================
CREATE TRIGGER trigger_gtr_vasp_profiles_updated_at
  BEFORE UPDATE ON gtr_vasp_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

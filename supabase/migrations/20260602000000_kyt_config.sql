-- ==========================================================
-- TranSight TR — KYT Config + Block Registry Migration
-- VASP별 KYT 모드 설정 + ra_code2 기반 자동 차단 레지스트리
-- ==========================================================

-- ==========================================================
-- 1. vasps 테이블 — KYT 설정 컬럼 추가
-- ==========================================================

-- KYT 운영 모드
ALTER TABLE vasps ADD COLUMN kyt_mode TEXT NOT NULL DEFAULT 'none';
-- 'none'     = TR만 사용 (KYT Gate 비활성)
-- 'kyt_only' = KYT만 사용 (TR 미사용)
-- 'atomic'   = KYT + TR 원자적 통합 (Atomic Gate 활성)

-- KYT 적용 범위
ALTER TABLE vasps ADD COLUMN kyt_scope TEXT NOT NULL DEFAULT 'tr_only';
-- 'tr_only' = TR 대상 트랜잭션만 KYT 적용 (기준금액 초과 등)
-- 'all'     = 전체 트랜잭션에 KYT 적용

-- 자동 사전 차단 (ra_code2 매칭 시)
ALTER TABLE vasps ADD COLUMN kyt_auto_block BOOLEAN NOT NULL DEFAULT false;
-- true  = 등록된 ra_code2 매칭 시 자동 차단 (PII 미전송)
-- false = KYT 결과만 리턴, TR은 그냥 진행 (고객이 판단)

-- 차단 시 소명 요청(SAR) 정보 리턴
ALTER TABLE vasps ADD COLUMN kyt_return_for_sar BOOLEAN NOT NULL DEFAULT false;
-- true  = 차단/경고 시 상세 RA 정보 포함 리턴 (고객이 소명 요청용으로 사용)
-- false = 기본 차단 사유만 리턴

-- 제약 조건
ALTER TABLE vasps ADD CONSTRAINT chk_kyt_mode
  CHECK (kyt_mode IN ('none', 'kyt_only', 'atomic'));

ALTER TABLE vasps ADD CONSTRAINT chk_kyt_scope
  CHECK (kyt_scope IN ('tr_only', 'all'));

-- ==========================================================
-- 2. kyt_tr_block_registry — ra_code2 차단 대상 등록
-- VASP별로 자동 차단할 ra_code2를 등록
-- deny_list 대상만 (white_list ra_code2는 대상 아님)
-- 관리자만 설정 변경 가능 (service_role only)
-- ==========================================================
CREATE TABLE kyt_tr_block_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vasp_id UUID NOT NULL REFERENCES vasps(id) ON DELETE CASCADE,

  -- TranSight KYT RA 모델 기반 (v1.3.3)
  -- ra_code1: 상위 분류 (BL=블랙리스트, HRA=고위험 등)
  -- ra_code2: 위험/특성 유형 (세부 분류) ← 이것을 등록
  -- ra_code3: 개별 주체명 (Lazarus 등)
  ra_code2 TEXT NOT NULL,

  -- 매칭 조건 (선택)
  -- risk_analysis_type: Direct(직접), Tracked(추적)
  -- NULL이면 모든 분석유형에 적용
  risk_analysis_type TEXT,
  -- max_hop_count: 이 홉 수 이하에서만 차단
  -- NULL이면 모든 홉에 적용
  max_hop_count INTEGER,

  description TEXT,                   -- 관리 메모
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT,                    -- 등록자 (관리자)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(vasp_id, ra_code2, risk_analysis_type)  -- VASP별 ra_code2 + 분석유형 중복 방지
);

-- 인덱스
CREATE INDEX idx_kyt_block_registry_vasp ON kyt_tr_block_registry(vasp_id);
CREATE INDEX idx_kyt_block_registry_code ON kyt_tr_block_registry(ra_code2);
CREATE INDEX idx_kyt_block_registry_active ON kyt_tr_block_registry(vasp_id, is_active) WHERE is_active = true;

-- RLS
ALTER TABLE kyt_tr_block_registry ENABLE ROW LEVEL SECURITY;

-- Service Role만 CRUD 가능 (관리자 전용)
CREATE POLICY "Service role full access" ON kyt_tr_block_registry
  FOR ALL USING (auth.role() = 'service_role');

-- updated_at 자동 갱신
CREATE TRIGGER trigger_kyt_block_registry_updated_at
  BEFORE UPDATE ON kyt_tr_block_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================
-- 3. 참고: TranSight KYT RA 모델 v1.3.3 deny_list ra_code2 목록
-- ==========================================================
-- ra_code2 | 설명 (추정)                        | 기본 risk_level | 기본 score (Direct)
-- ---------|-------------------------------------|-----------------|--------------------
-- OIS      | OFAC/국제제재 대상                    | SEVERE          | 100
-- SRA      | 제재관련활동 (Sanctions Related)       | SEVERE          | 100
-- DIS      | 북한관련제재대상 (DPRK Sanctions)      | SEVERE          | 100
-- DT       | 다크넷/테러자금 (Dark/Terror)          | SEVERE          | 100
-- CSA      | 아동성착취물 (Child Sexual Abuse)      | HIGH            | 98.99
-- HA       | 해킹 (Hacking Attack)                | HIGH            | 66.79
-- RW       | 랜섬웨어 (Ransomware)                 | HIGH            | 66.79
-- CS       | 사기 (Crypto Scam)                    | HIGH            | 66.14
-- PS       | 피싱/스캠 (Phishing Scam)             | HIGH            | 66.14
-- CSAC     | 아동착취관련활동                       | HIGH            | 60.1
-- OG       | 범죄조직 (Organized Crime)             | MEDIUM          | 47.42
-- VP       | 가상자산 불법사업자                     | MEDIUM          | 45.3
-- IAF      | 불법자금흐름 (Illicit Asset Flow)      | MEDIUM          | 45.3
-- IPT      | 불법거래 (Illicit P2P Trading)         | MEDIUM          | 43.89
-- SRC      | 제재위험국가 (Sanction Risk Country)   | MEDIUM          | 43.19
-- CM       | 코인믹서 (Coin Mixer)                 | MEDIUM          | 42
-- PCR      | 개인정보범죄 (Privacy Crime)           | MEDIUM          | 40
-- OKUV     | 해외미확인거래소                       | MEDIUM          | 40
-- KUV      | 국내미확인거래소                       | MEDIUM          | 40
-- OT       | 기타위험 (Other Threats)               | LOW             | 30.5
-- UR       | 미확인위험 (Unidentified Risk)         | LOW             | 30.5

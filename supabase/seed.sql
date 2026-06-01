-- ==========================================================
-- TranSight TR — Seed Data (개발/테스트용)
-- ==========================================================

-- 1. TranSight Hub 자체 등록
INSERT INTO vasps (vasp_entity_id, vasp_name, vasp_legal_name, country_of_registration, alliance_name, endpoint_url, channel_type, health)
VALUES (
  'transight-hub',
  'TranSight Hub',
  'Bonanza Factory Co., Ltd.',
  'KR',
  'transight',
  'http://localhost:54321/functions/v1',
  'HTTPS',
  'up'
);

-- 2. 테스트용 VASP (CODE 호환 거래소 시뮬레이션)
INSERT INTO vasps (vasp_entity_id, vasp_name, vasp_legal_name, country_of_registration, alliance_name, channel_type, health)
VALUES
  ('test-exchange-a', 'Test Exchange A', 'Test Exchange A Inc.', 'KR', 'code', 'HTTPS', 'up'),
  ('test-exchange-b', 'Test Exchange B', 'Test Exchange B Co., Ltd.', 'KR', 'code', 'HTTPS', 'up'),
  ('test-bank-c', 'Test Bank C', 'Test Bank C', 'KR', 'transight', 'LEASED_LINE', 'up');

-- 3. 테스트용 공개키 (실제 Ed25519 키쌍은 아님, 개발 테스트용 placeholder)
INSERT INTO public_keys (vasp_id, public_key, algorithm, is_active)
SELECT id, 'dGVzdC1wdWJsaWMta2V5LXBsYWNlaG9sZGVy', 'Ed25519', true
FROM vasps
WHERE vasp_entity_id = 'test-exchange-a';

INSERT INTO public_keys (vasp_id, public_key, algorithm, is_active)
SELECT id, 'dGVzdC1wdWJsaWMta2V5LXBsYWNlaG9sZGVyMg==', 'Ed25519', true
FROM vasps
WHERE vasp_entity_id = 'test-exchange-b';

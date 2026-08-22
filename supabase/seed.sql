-- ==========================================================
-- TravelSafer seed data for local development
-- ==========================================================

INSERT INTO vasps (
  vasp_entity_id,
  vasp_name,
  vasp_legal_name,
  country_of_registration,
  alliance_name,
  endpoint_url,
  channel_type,
  health,
  metadata
)
VALUES (
  'bonanza-hub',
  'TravelSafer',
  'Bonanza Factory Co., Ltd.',
  'KR',
  'bonanza',
  'http://localhost:54321/functions/v1',
  'HTTPS',
  'up',
  '{"capabilities":{"travelRule":true,"ownerCheck":true}}'
)
ON CONFLICT (vasp_entity_id) DO UPDATE SET
  vasp_name = EXCLUDED.vasp_name,
  vasp_legal_name = EXCLUDED.vasp_legal_name,
  alliance_name = EXCLUDED.alliance_name,
  endpoint_url = EXCLUDED.endpoint_url,
  channel_type = EXCLUDED.channel_type,
  health = EXCLUDED.health,
  metadata = EXCLUDED.metadata;

INSERT INTO vasps (
  vasp_entity_id,
  vasp_name,
  vasp_legal_name,
  country_of_registration,
  alliance_name,
  endpoint_url,
  channel_type,
  health,
  metadata
)
VALUES
  (
    'test-exchange-a',
    'Test Exchange A',
    'Test Exchange A Inc.',
    'KR',
    'code-compatible',
    'http://localhost:54321/functions/v1',
    'HTTPS',
    'up',
    '{"capabilities":{"travelRule":true,"ownerCheck":true}}'
  ),
  (
    'test-exchange-b',
    'Test Exchange B',
    'Test Exchange B Co., Ltd.',
    'KR',
    'bonanza',
    'http://localhost:54321/functions/v1',
    'HTTPS',
    'up',
    '{"capabilities":{"travelRule":true,"ownerCheck":true}}'
  ),
  (
    'test-bank-c',
    'Test Bank C',
    'Test Bank C',
    'KR',
    'bonanza',
    'http://localhost:54321/functions/v1',
    'LEASED_LINE',
    'up',
    '{"capabilities":{"travelRule":true,"ownerCheck":true},"deployment":"idc"}'
  )
ON CONFLICT (vasp_entity_id) DO UPDATE SET
  vasp_name = EXCLUDED.vasp_name,
  vasp_legal_name = EXCLUDED.vasp_legal_name,
  alliance_name = EXCLUDED.alliance_name,
  endpoint_url = EXCLUDED.endpoint_url,
  channel_type = EXCLUDED.channel_type,
  health = EXCLUDED.health,
  metadata = EXCLUDED.metadata;

INSERT INTO public_keys (
  vasp_id,
  public_key,
  algorithm,
  key_purpose,
  is_active,
  metadata
)
SELECT
  id,
  'dGVzdC1wdWJsaWMta2V5LXBsYWNlaG9sZGVy',
  'Ed25519',
  'both',
  true,
  '{"encryptionDerivation":"ed25519_to_x25519","encryptionSuite":"X25519-XSalsa20-Poly1305"}'
FROM vasps
WHERE vasp_entity_id = 'test-exchange-a'
ON CONFLICT DO NOTHING;

INSERT INTO public_keys (
  vasp_id,
  public_key,
  algorithm,
  key_purpose,
  is_active,
  metadata
)
SELECT
  id,
  'dGVzdC1wdWJsaWMta2V5LXBsYWNlaG9sZGVyMg==',
  'Ed25519',
  'both',
  true,
  '{"encryptionDerivation":"ed25519_to_x25519","encryptionSuite":"X25519-XSalsa20-Poly1305"}'
FROM vasps
WHERE vasp_entity_id = 'test-exchange-b'
ON CONFLICT DO NOTHING;

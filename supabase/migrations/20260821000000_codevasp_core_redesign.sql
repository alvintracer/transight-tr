-- ==========================================================
-- Bonanza TTR CodeVASP-core redesign
-- ==========================================================

-- Bonanza becomes the default network namespace for new VASP records.
ALTER TABLE vasps
  ALTER COLUMN alliance_name SET DEFAULT 'bonanza';

-- Public key registry keeps the CodeVASP canonical Ed25519 public key, while
-- clients derive X25519 keys for payload encryption.
ALTER TABLE public_keys
  ADD COLUMN IF NOT EXISTS key_purpose TEXT NOT NULL DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS kid TEXT,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_public_keys_key_purpose'
  ) THEN
    ALTER TABLE public_keys
      ADD CONSTRAINT chk_public_keys_key_purpose
      CHECK (key_purpose IN ('signing', 'encryption', 'both'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_public_keys_purpose
  ON public_keys(vasp_id, key_purpose, is_active);

CREATE INDEX IF NOT EXISTS idx_public_keys_kid
  ON public_keys(kid)
  WHERE kid IS NOT NULL;

-- OwnerCheck is Bonanza's Identical Account Owner Verification extension.
-- It is not part of the original CodeVASP /v1/code namespace.
CREATE TABLE IF NOT EXISTS owner_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_check_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  originator_vasp_id UUID REFERENCES vasps(id),
  beneficiary_vasp_id UUID REFERENCES vasps(id),
  currency TEXT NOT NULL,
  address TEXT NOT NULL,
  tag TEXT,
  network TEXT,
  payload_encrypted TEXT NOT NULL,
  result TEXT,
  reason_type TEXT,
  reason_msg TEXT,
  policy JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_owner_checks_status'
  ) THEN
    ALTER TABLE owner_checks
      ADD CONSTRAINT chk_owner_checks_status
      CHECK (status IN ('pending', 'verified', 'denied', 'error', 'canceled'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_owner_checks_owner_check_id
  ON owner_checks(owner_check_id);

CREATE INDEX IF NOT EXISTS idx_owner_checks_status
  ON owner_checks(status);

CREATE INDEX IF NOT EXISTS idx_owner_checks_vasp_pair
  ON owner_checks(originator_vasp_id, beneficiary_vasp_id);

CREATE INDEX IF NOT EXISTS idx_owner_checks_address
  ON owner_checks(currency, address);

DROP TRIGGER IF EXISTS trigger_owner_checks_updated_at ON owner_checks;
CREATE TRIGGER trigger_owner_checks_updated_at
  BEFORE UPDATE ON owner_checks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE owner_checks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'owner_checks'
      AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access" ON owner_checks
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

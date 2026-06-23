---
type: dev-task
date: 2026-06-24
status: active
source: AI-Sessions/wiki/sources/2026-06-24-runtime-and-ops-refresh
---

# TranSight TR Core Code Map

## Summary

This note points future agents to the highest-signal code and operational files for the current implementation baseline.

## Context

The repo is no longer explained well enough by `transfer-auth` alone. Beneficiary-side processing, shared security guards, migrations, and test automation now matter to understanding the system.

## Details

### Read first

- `supabase/functions/transfer-auth/index.ts`
  - Outgoing and incoming transfer authorization flow, state updates, and routing entrypoint
- `supabase/functions/transfer-response/index.ts`
  - Beneficiary confirm, deny, second IVMS101 exchange, pending list, and webhook intake
- `supabase/functions/_shared/protocol-adapter.ts`
  - Adapter registry and transport-specific behavior for `code`, `sumsub`, `gtr`, `transight`, `direct`, and stub `verifyvasp`
- `supabase/functions/_shared/kyt-gate.ts`
  - Live KYT integration, thresholds, fail-open behavior, and RA-code block registry matching
- `supabase/functions/_shared/security.ts`
  - Shared validation, sanitization, payload-size checks, timestamp checks, and rate limiting

### Read next

- `supabase/functions/vasp-registry/index.ts`
  - VASP CRUD, wallet lookup, key rotation, and address verification
- `src/services/transfer-service.ts`
  - Transfer persistence, state transitions, and queue behavior
- `src/types/transfer.ts`
  - Transfer state machine contract
- `src/constants/error-codes.ts`
  - Shared denial and error code vocabulary
- `supabase/migrations/20260602000000_kyt_config.sql`
  - VASP-level KYT controls and `kyt_tr_block_registry`
- `supabase/migrations/20260606000000_gtr_adapter.sql`
  - `gtr_vasp_profiles` and `gtr_transfer_logs`
- `scripts/e2e-test.mjs`
  - Live regression coverage and practical API examples
- `docs/dev-guide.md`
  - Deploy, secrets, testing, and cloud workflow runbook

### Code-reading anchors

- `alliance_name` determines routing into the adapter layer.
- `adapterOptions.gtr` controls GTR-specific payload and field verification behavior.
- KYT currently returns fail-open PASS behavior on upstream outage or missing config.
- `transfer-response` is the best entrypoint for beneficiary-side lifecycle behavior.
- `scripts/e2e-test.mjs` is the fastest way to see what operators currently expect to work.

## Links

- [[AI-Sessions/wiki/sources/2026-06-24-runtime-and-ops-refresh]]
- [[AI-Sessions/wiki/projects/transight-tr-june-2026-delivery-status]]
- [[AI-Sessions/wiki/design/transight-tr-runtime-architecture]]
- [[docs/dev-guide]]

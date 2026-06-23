---
type: source
date: 2026-06-24
status: active
source_type: code-and-doc-refresh
---

# TranSight TR Runtime And Ops Refresh

## Summary

This source note captures the implementation delta between the initial 2026-06-13 wiki ingest and the current repository state on 2026-06-24.

## Reviewed Inputs

- `docs/dev-guide.md`
- `docs/ko/internal/implementation-status.md`
- `supabase/functions/transfer-response/index.ts`
- `supabase/functions/_shared/security.ts`
- `supabase/functions/_shared/protocol-adapter.ts`
- `supabase/functions/_shared/kyt-gate.ts`
- `scripts/e2e-test.mjs`
- `supabase/migrations/20260602000000_kyt_config.sql`
- `supabase/migrations/20260606000000_gtr_adapter.sql`
- `src/constants/error-codes.ts`
- `git log --oneline -n 20`

## Key Additions Since The First Wiki Baseline

### Runtime surface expansion

- `transfer-response` is now a first-class Edge Function for beneficiary-side processing.
- The response surface includes confirm, deny, beneficiary IVMS101 delivery, pending-list lookup, per-transfer detail lookup, and webhook intake.
- The hub now documents and implements both outgoing authorization and incoming beneficiary response flows.

### Security and validation layer

- Shared request hardening now exists in `supabase/functions/_shared/security.ts`.
- The shared layer covers required-field validation, transfer and VASP ID validation, currency and amount checks, body sanitization, payload-size limits, content-type checks, timestamp freshness checks, and in-memory rate limiting.
- Error handling is more explicit in `src/constants/error-codes.ts`, including GTR-specific and channel-specific failure modes.

### Adapter and rail growth

- The adapter router now covers `code`, `sumsub`, `gtr`, `transight`, `direct`, and stub `verifyvasp`.
- Sumsub support includes HMAC-SHA256 request signing and async result handling.
- GTR support includes One-Step PII verification, profile lookup, field-level result mapping, timeout handling, and hashed transfer logs that avoid storing raw PII payloads.

### KYT operationalization

- KYT moved from a documentation-level concept into a real integration path with HMAC signing, timeout handling, configurable thresholds, and VASP-level mode flags.
- Migration `20260602000000_kyt_config.sql` adds `kyt_mode`, `kyt_scope`, `kyt_auto_block`, `kyt_return_for_sar`, and `kyt_tr_block_registry`.
- Atomic gate behavior is currently fail-open when the external KYT service is unavailable or unconfigured.

### Verification and operator workflow

- `scripts/e2e-test.mjs` provides a live API regression suite covering health, registry CRUD, transfer-auth, transfer-response, routing, and edge cases.
- `docs/dev-guide.md` now acts as an operator/developer runbook for deploy, secrets, docs preview, E2E testing, and cloud-first workflow.
- The recent Git history shows implementation progress through protocol adapters, live KYT integration, transfer-response, and the Phase 7 E2E/security pass.

## Links

- [[AI-Sessions/wiki/projects/transight-tr-june-2026-delivery-status]]
- [[AI-Sessions/wiki/design/transight-tr-runtime-architecture]]
- [[AI-Sessions/wiki/dev-tasks/transight-tr-core-code-map]]
- [[AI-Sessions/wiki/decisions/2026-06-24-phase-7-implementation-baseline]]

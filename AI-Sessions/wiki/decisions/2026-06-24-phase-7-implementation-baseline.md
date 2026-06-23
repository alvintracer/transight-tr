---
type: decision
date: 2026-06-24
status: active
source: AI-Sessions/wiki/sources/2026-06-24-runtime-and-ops-refresh
---

# Phase 7 Implementation Baseline

## Summary

The working implementation baseline for TranSight TR is no longer just `transfer-auth + adapter router + conceptual KYT`. Future agents should treat the current system as a four-endpoint hub with beneficiary response handling, shared security validation, live KYT integration, and executable E2E verification.

## Decision

The current baseline for repo understanding and future ingest work is:

1. Runtime entrypoints are `health`, `vasp-registry`, `transfer-auth`, and `transfer-response`.
2. Shared operational modules include `protocol-adapter`, `kyt-gate`, `security`, and the service/type layers under `src/`.
3. Adapter coverage is expected to include `code`, `sumsub`, `gtr`, `transight`, and `direct`, with `verifyvasp` explicitly treated as unfinished.
4. Operational truth now includes `docs/dev-guide.md` and `scripts/e2e-test.mjs`, not just the product context and API spec.

## Why

- The original wiki baseline under-described the beneficiary-side API and the security layer.
- New work now depends on understanding migration-backed KYT config and GTR profile/log tables.
- The repo has enough operational behavior that code-only context is no longer sufficient for handoff.

## Risks To Remember

- KYT currently fails open on timeout, upstream error, or missing configuration.
- CODE header signing is not fully completed in shared adapter code.
- `verifyvasp` should not be described as delivered.

## Links

- [[AI-Sessions/wiki/projects/transight-tr-june-2026-delivery-status]]
- [[AI-Sessions/wiki/dev-tasks/transight-tr-core-code-map]]
- [[docs/dev-guide]]

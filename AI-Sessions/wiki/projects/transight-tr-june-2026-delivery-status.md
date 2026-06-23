---
type: project
date: 2026-06-24
status: active
source: AI-Sessions/wiki/sources/2026-06-24-runtime-and-ops-refresh
---

# TranSight TR June 2026 Delivery Status

## Summary

TranSight TR has moved beyond the initial code-map baseline into a fuller delivery slice: expanded adapter coverage, live KYT integration, beneficiary-side response APIs, shared security validation, and an executable E2E regression script.

## Delivered Areas

### API surface

- `health`
- `vasp-registry`
- `transfer-auth`
- `transfer-response`

### Adapter coverage

- `code`: CODE VASP compatible relay
- `sumsub`: TRUST-oriented gateway with HMAC auth
- `gtr`: one-step PII verification rail with profile and log tables
- `transight`: internal same-network shortcut
- `direct`: direct HTTPS or mTLS style relay
- `verifyvasp`: still stubbed, not production-ready

### KYT and control plane

- Atomic KYT now calls the live TranSight KYT API instead of staying purely conceptual.
- VASP-level settings control mode, scope, auto-block behavior, and SAR-style detail return.
- `kyt_tr_block_registry` supports RA-code-driven blocking policy per institution.
- Current behavior is fail-open on service outage or missing KYT configuration.

### Beneficiary-side handling

- `transfer-response` now covers confirm, deny, second IVMS101 exchange, pending incoming list, and webhook intake.
- Callback-style notification back to the originator VASP is built into confirm, deny, and beneficiary-data paths.

### Verification posture

- `scripts/e2e-test.mjs` exercises the main live endpoints and routing behaviors.
- `docs/dev-guide.md` documents the cloud-first operating workflow, deploy commands, and secrets setup.

## Open Boundaries

- `verifyvasp` remains intentionally unimplemented.
- CODE signing headers still contain a placeholder signature path in the shared adapter code.
- GTR timeout and service failures do not hard-approve the transfer, but some GTR mapping paths return `pending` while the broader KYT gate remains fail-open.

## Links

- [[AI-Sessions/wiki/sources/2026-06-24-runtime-and-ops-refresh]]
- [[AI-Sessions/wiki/decisions/2026-06-24-phase-7-implementation-baseline]]
- [[docs/dev-guide]]
- [[docs/ko/internal/implementation-status]]

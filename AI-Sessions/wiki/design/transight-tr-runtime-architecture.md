---
type: design
date: 2026-06-24
status: active
source: AI-Sessions/wiki/sources/2026-06-24-runtime-and-ops-refresh
---

# TranSight TR Runtime Architecture

## Summary

TranSight TR is best understood as `Edge Function runtime + shared security guards + Atomic KYT Gate + protocol adapter layer + transfer and beneficiary state handling + operator verification tooling`.

## Context

The initial runtime note described the hub correctly at a high level, but it under-represented the beneficiary response API, the shared validation ring, and the migration-backed operational controls.

## Details

### Entrypoint layer

- `transfer-auth` handles outgoing auth, incoming auth intake, status lookup, txid reporting, and cancellation.
- `transfer-response` handles beneficiary confirm and deny actions, second IVMS101 exchange, pending-list reads, transfer detail reads, and webhook ingestion.
- `vasp-registry` remains the discovery and target metadata surface.

### Atomic KYT Gate

- `kyt_mode`, `kyt_scope`, `kyt_auto_block`, and `kyt_return_for_sar` are migration-backed controls on each VASP record.
- `kyt_tr_block_registry` adds institution-specific RA-code blocking policy.
- BLOCK terminates before TR payload relay.
- PASS and WARN continue into routing.
- Upstream KYT outages are currently fail-open.

### Adapter Layer

- `code`: CODE-compatible relay
- `sumsub`: TRUST-oriented async rail
- `gtr`: one-step PII verification rail with dedicated profile and hashed log tables
- `transight`: internal same-network path
- `direct`: direct endpoint relay
- `verifyvasp`: explicit stub, not shipped

### Security ring

- Shared request validation now exists before business logic: required fields, ID and amount validation, body sanitization, content-type enforcement, timestamp freshness, payload-size caps, and in-memory rate limiting.

### State handling

- Outgoing flow still centers on `wait -> verified/denied -> pending -> processing -> wait-confirmed -> confirmed`.
- Beneficiary-side response handling is now a visible part of the runtime, not just an implied callback.
- Audit logging exists across both auth and response paths.

## Links

- [[AI-Sessions/wiki/sources/2026-06-24-runtime-and-ops-refresh]]
- [[AI-Sessions/wiki/projects/transight-tr-june-2026-delivery-status]]
- [[AI-Sessions/wiki/dev-tasks/transight-tr-core-code-map]]
- [[AI-Sessions/wiki/decisions/2026-06-24-phase-7-implementation-baseline]]

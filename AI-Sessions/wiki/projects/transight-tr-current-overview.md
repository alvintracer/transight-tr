---
type: project
date: 2026-06-24
status: active
source: AI-Sessions/wiki/sources/2026-06-24-runtime-and-ops-refresh
---

# TranSight TR Current Overview

## Summary

TranSight TR is a Travel Rule hub that bridges domestic and cross-border VASP rails. The current repo state now includes a broader runtime than the first wiki ingest: four Edge Function entrypoints, multi-rail adapter routing, live KYT policy controls, beneficiary response handling, and an operator-facing E2E verification workflow.

## Context

The first wiki baseline was created on 2026-06-13. Since then, the repository has materially advanced through adapter expansion, KYT operationalization, beneficiary-side APIs, and test automation.

## Details

### Current runtime shape

- Runtime entrypoints: `health`, `vasp-registry`, `transfer-auth`, `transfer-response`
- Shared orchestration modules: `protocol-adapter`, `kyt-gate`, `security`
- Service and state logic: `src/services/*`, `src/types/*`, `src/constants/*`

### Delivered integration rails

- `code`
- `sumsub`
- `gtr`
- `transight`
- `direct`
- `verifyvasp` remains a stubbed future rail

### Operational traits that matter

- KYT now has live external API integration plus VASP-level mode and block-registry controls.
- `transfer-response` models beneficiary confirmation, denial, second IVMS101 delivery, and webhook intake.
- The repo has a cloud-first operator workflow documented in `docs/dev-guide.md`.
- A live E2E script exists in `scripts/e2e-test.mjs`.

## Links

- [[AI-Sessions/wiki/projects/transight-tr-june-2026-delivery-status]]
- [[AI-Sessions/wiki/design/transight-tr-runtime-architecture]]
- [[AI-Sessions/wiki/dev-tasks/transight-tr-core-code-map]]
- [[AI-Sessions/wiki/decisions/2026-06-24-phase-7-implementation-baseline]]

# Bonanza TTR Context Index

This vault is the operating context for the Bonanza TTR Travel Rule Gateway project.

## Root Docs

- [[README]]
- [[START_HERE]]
- [[AGENTS]]
- [[CLAUDE]]
- [[CHATGPT]]
- [[log]]

## Product Source Of Truth

- [[docs/TRANSIGHT_PROJECT_CONTEXT]]
- [[docs/ttr-api-specification]]
- [[AI-Sessions/wiki/design/2026-08-21-ttr-codevasp-core-redesign-plan]]

## Core Code Map

- `supabase/functions/health/index.ts`
- `supabase/functions/vasp-registry/index.ts`
- `supabase/functions/transfer-auth/index.ts`
- `supabase/functions/owner-check/index.ts`
- `supabase/functions/transfer-response/index.ts`
- `supabase/functions/_shared/protocol-adapter.ts`
- `supabase/functions/_shared/kyt-gate.ts`
- `supabase/functions/_shared/security.ts`
- `src/types/code-api.ts`
- `src/types/transfer.ts`
- `src/types/vasp.ts`

## Current Project Docs

- [[AI-Sessions/wiki/projects/transight-tr-current-overview]]
- [[AI-Sessions/wiki/projects/transight-tr-june-2026-delivery-status]]
- [[AI-Sessions/wiki/projects/2026-08-05-vv-travel-rule-gateway-regulatory-architecture]]
- [[AI-Sessions/wiki/design/transight-tr-runtime-architecture]]
- [[AI-Sessions/wiki/design/2026-08-09-vv-enclave-deployment-options]]
- [[AI-Sessions/wiki/design/2026-08-11-kakaopay-vv-dmz-direct-integration]]
- [[AI-Sessions/wiki/design/2026-08-21-ttr-codevasp-core-redesign-plan]]
- [[AI-Sessions/wiki/dev-tasks/transight-tr-core-code-map]]

## Concepts

- [[AI-Sessions/wiki/concepts/2026-08-12-vv-verifyname-protocol-interpretation]]

## Decisions

- [[AI-Sessions/wiki/decisions/2026-06-13-contexthub-governance]]
- [[AI-Sessions/wiki/decisions/2026-06-13-transight-runtime-baseline]]
- [[AI-Sessions/wiki/decisions/2026-06-24-phase-7-implementation-baseline]]
- [[AI-Sessions/wiki/decisions/2026-08-07-vv-bf-managed-enclave-idc-baseline]]
- [[AI-Sessions/wiki/decisions/2026-08-10-vv-no-bf-data-plane-pivot]]
- [[AI-Sessions/wiki/decisions/2026-08-11-vv-swift-mt-precedent-applicability]]

## Sources

- [[AI-Sessions/wiki/sources/2026-06-13-product-docs-and-code-baseline]]
- [[AI-Sessions/wiki/sources/2026-06-24-runtime-and-ops-refresh]]

## Wiki Structure

- `AI-Sessions/raw/`: raw source materials. Do not edit.
- `AI-Sessions/conversations/`: handoff and session notes.
- `AI-Sessions/wiki/sources/`: summarized source documents and code baselines.
- `AI-Sessions/wiki/concepts/`: reusable concepts and frameworks.
- `AI-Sessions/wiki/decisions/`: architectural and operating decisions.
- `AI-Sessions/wiki/errors/`: failed paths and risk notes.
- `AI-Sessions/wiki/projects/`: project state and overview.
- `AI-Sessions/wiki/design/`: architecture and design notes.
- `AI-Sessions/wiki/dev-tasks/`: implementation entry points and code maps.

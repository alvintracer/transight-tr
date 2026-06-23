# TranSight TR Context Index

이 문서는 TranSight TR 저장소 안의 AI 업무 위키 진입점입니다.

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
- [[docs/ko/index]]
- [[docs/ko/guide/architecture]]
- [[docs/ko/guide/kyt-gate]]
- [[docs/ko/api/gtr-adapter]]

## Core Code Map

- `supabase/functions/transfer-auth/index.ts`
- `supabase/functions/transfer-response/index.ts`
- `supabase/functions/vasp-registry/index.ts`
- `supabase/functions/_shared/protocol-adapter.ts`
- `supabase/functions/_shared/kyt-gate.ts`
- `supabase/functions/_shared/security.ts`
- `src/services/transfer-service.ts`
- `src/types/transfer.ts`

## Wiki Structure

- `AI-Sessions/raw/`: 원본 자료 보관
- `AI-Sessions/conversations/`: handoff 및 세션 인수인계
- `AI-Sessions/wiki/sources/`: 문서와 코드 기준선 요약
- `AI-Sessions/wiki/concepts/`: 반복 개념과 프레임워크
- `AI-Sessions/wiki/decisions/`: 구조와 운영 결정
- `AI-Sessions/wiki/errors/`: 실패 사례와 리스크
- `AI-Sessions/wiki/projects/`: 프로젝트 맥락과 현재 상태
- `AI-Sessions/wiki/design/`: 아키텍처와 설계 요약
- `AI-Sessions/wiki/dev-tasks/`: 구현 진입점과 코드 맵

## Current Project Docs

- [[AI-Sessions/wiki/projects/transight-tr-current-overview]]
- [[AI-Sessions/wiki/projects/transight-tr-june-2026-delivery-status]]
- [[AI-Sessions/wiki/design/transight-tr-runtime-architecture]]
- [[AI-Sessions/wiki/dev-tasks/transight-tr-core-code-map]]

## Decisions

- [[AI-Sessions/wiki/decisions/2026-06-13-contexthub-governance]]
- [[AI-Sessions/wiki/decisions/2026-06-13-transight-runtime-baseline]]
- [[AI-Sessions/wiki/decisions/2026-06-24-phase-7-implementation-baseline]]

## Sources

- [[AI-Sessions/wiki/sources/2026-06-13-product-docs-and-code-baseline]]
- [[AI-Sessions/wiki/sources/2026-06-24-runtime-and-ops-refresh]]

## Existing ContextHub Meta Docs

- [[AI-Sessions/wiki/design/agent-wiki-operating-model]]
- [[AI-Sessions/wiki/projects/transight-contexthub-setup]]
- [[AI-Sessions/wiki/projects/chatgpt-share-01-overview]]
- [[AI-Sessions/wiki/projects/chatgpt-share-02-structure]]
- [[AI-Sessions/wiki/projects/chatgpt-share-03-rules-and-prompts]]

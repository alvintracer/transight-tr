---
type: source
date: 2026-06-13
status: active
source: docs/TRANSIGHT_PROJECT_CONTEXT.md, docs/ttr-api-specification.md, docs/ko/index.md, docs/ko/guide/architecture.md, docs/ko/guide/kyt-gate.md, docs/ko/api/gtr-adapter.md, supabase/functions/_shared/protocol-adapter.ts, supabase/functions/_shared/kyt-gate.ts, supabase/functions/transfer-auth/index.ts, supabase/functions/transfer-response/index.ts, supabase/functions/vasp-registry/index.ts, src/services/transfer-service.ts, src/types/transfer.ts
---

# Product Docs And Code Baseline

## Summary

이 문서는 2026-06-13 시점의 TranSight TR 주요 문서와 핵심 코드에서 공통으로 확인되는 사실을 묶은 초기 ingest 기준선이다.

## Context

기존 root 문서는 템플릿 성격이 강했고, 실제 제품의 최신 구조는 `docs/`와 Supabase Edge Functions 코드에 더 정확히 반영되어 있었다.

## Details

### 문서에서 확인된 기준

- 제품 포지셔닝은 금융기관 호환 Travel Rule Hub
- 핵심 차별점은 Atomic KYT Gate
- 문서상 주요 레일은 CODE, Sumsub, GTR, Direct, 금융기관 보안 채널
- 최신 API 기준 문서는 `docs/ttr-api-specification.md`
- 한국어 제품 설명의 진입점은 `docs/ko/index.md`

### 코드에서 확인된 기준

- `transfer-auth`가 KYT 수행과 adapter routing의 메인 오케스트레이터
- `protocol-adapter.ts`가 `code`, `sumsub`, `gtr`, `transight`, `direct`, `verifyvasp`를 관리
- `gtr`는 이미 구현되어 있고 `verifyvasp`는 미구현 placeholder
- `kyt-gate.ts`는 KYT API 호출, 임계값 기반 PASS/WARN/BLOCK, VASP별 설정을 처리
- `src/types/transfer.ts`는 8단계 상태 머신을 정의
- `src/services/transfer-service.ts`는 transfer CRUD, 상태 전이, TTL Queue를 담당

### 위키로 승격 가능한 공통 지식

- 제품 구조와 문서 우선순위
- 핵심 어댑터 지도
- 상태 머신과 KYT gate의 역할
- GTR을 초기 글로벌 bootstrap rail로 보는 현재 전략

### wiki에 승격하지 않은 것

- 세부 환경변수 값
- 민감할 수 있는 실제 연동 정보나 고객 원문
- 확정되지 않은 미래 로드맵 세부 일정

## Links

- [[AI-Sessions/wiki/projects/transight-tr-current-overview]]
- [[AI-Sessions/wiki/design/transight-tr-runtime-architecture]]
- [[AI-Sessions/wiki/dev-tasks/transight-tr-core-code-map]]
- [[AI-Sessions/wiki/decisions/2026-06-13-transight-runtime-baseline]]

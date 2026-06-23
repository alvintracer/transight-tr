---
type: decision
date: 2026-06-13
status: active
source: AI-Sessions/wiki/sources/2026-06-13-product-docs-and-code-baseline
---

# TranSight Runtime Baseline

## Summary

현재 TranSight TR의 기준선은 Supabase Edge Functions 중심 런타임과 Atomic KYT Gate, Adapter 기반 브릿지 구조를 공식 기준으로 삼는 것이다.

## Context

루트 문서가 템플릿 설명 중심이었던 상태에서는 실제 제품 구조를 빠르게 파악하기 어려웠다. 문서와 코드에서 일관되게 반복되는 사실을 root 및 wiki 기준선으로 고정할 필요가 있었다.

## Details

### 기준선으로 채택한 항목

1. 메인 런타임은 Supabase Edge Functions다.
2. `transfer-auth`가 현재 출금 오케스트레이션의 중심이다.
3. KYT는 Atomic Gate로 선행되며, 위험 거래는 PII 전송 전 차단한다.
4. 외부 연동은 adapter layer를 통해 `code`, `sumsub`, `gtr`, `transight`, `direct` 기준으로 분기한다.
5. `gtr`는 현재 구현된 글로벌 bootstrap rail로 간주한다.
6. 상태 머신 기준은 `src/types/transfer.ts`의 8단계 모델을 따른다.

### 이유

- 문서와 코드가 이 구조를 공통으로 가리킨다.
- 신규 에이전트가 어디를 truth source로 볼지 빠르게 정할 수 있다.
- 향후 ingest와 query의 기준점이 된다.

## Links

- [[README]]
- [[START_HERE]]
- [[AI-Sessions/wiki/design/transight-tr-runtime-architecture]]
- [[AI-Sessions/wiki/dev-tasks/transight-tr-core-code-map]]

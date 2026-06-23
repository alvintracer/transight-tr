---
type: decision
date: 2026-06-13
status: active
source: START_HERE.md, AGENTS.md, CLAUDE.md, CHATGPT.md, prompts/, https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
---

# ContextHub Governance Baseline

## Summary

이 결정은 TranSight ContextHub를 회사 실무용 AI 업무 위키로 운영하기 위한 기준선을 고정한다.

## Context

여러 에이전트가 같은 프로젝트를 이어받을 때, 저장 기준과 민감정보 처리 방식이 다르면 wiki가 빠르게 오염된다.

따라서 명령 체계, 저장 필터, 민감정보 정책을 문서로 고정해야 한다.

## Details

### 결정 사항

1. 고정 명령 키워드는 `save`, `ingest`, `query`, `reference`, `lint`, `handoff`로 통일한다.
2. 사람이 읽는 운영 문서는 한국어로 작성한다.
3. wiki 저장 전에는 5가지 필터를 반드시 적용한다.
4. 필터를 통과하지 못한 정보는 wiki에 저장하지 않는다.
5. 민감정보는 wiki에 승격하지 않고 raw 또는 제한된 저장소에만 둔다.
6. 중요한 운영 변경이 있으면 `index.md`와 `log.md`를 함께 갱신한다.

### 저장 금지 정보

- 일회성 답변
- 사소한 중간 생각
- 검증되지 않은 추측
- API key
- 비밀번호
- 토큰
- 고객 개인정보
- 수사 관련 원문
- 비공개 계약 원문
- 민감한 지갑주소 또는 트랜잭션 사건 자료

### 기대 효과

- 에이전트 간 저장 기준 일치
- 인수인계 품질 개선
- 외부 공유 전 민감정보 노출 위험 감소
- 질문 결과의 누적형 재사용 가능성 증가

## Links

- [[START_HERE]]
- [[AGENTS]]
- [[CLAUDE]]
- [[CHATGPT]]
- [[AI-Sessions/wiki/design/agent-wiki-operating-model]]
- [[AI-Sessions/wiki/projects/transight-contexthub-setup]]

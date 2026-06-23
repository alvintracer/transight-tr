---
type: design
date: 2026-06-13
status: active
source: START_HERE.md, AGENTS.md, CLAUDE.md, CHATGPT.md, index.md, log.md, https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
---

# Agent Wiki Operating Model

## Summary

이 문서는 TranSight 팀이 사용하는 Obsidian 기반 AI 업무 위키의 운영 모델을 정의한다.

핵심은 Karpathy의 LLM Wiki 패턴을 실무형으로 바꿔, 여러 AI 에이전트가 같은 raw, 같은 wiki, 같은 schema를 기준으로 협업하도록 만드는 것이다.

## Context

기존 템플릿은 기본 구조와 일부 규칙은 갖추고 있었지만, 회사 실무용으로 쓰기 위해서는 다음이 더 분명해야 했다.

- 사람용 가이드와 에이전트용 명령 체계의 구분
- `reference`, `handoff`를 포함한 고정 명령 세트
- 저장 전 5가지 필터의 강제
- 민감정보의 wiki 비승격 원칙
- `index.md`와 `log.md`의 운영 허브 역할

## Details

### Karpathy 원칙과 현재 vault의 대응

- raw sources: `AI-Sessions/raw/`
- persistent wiki: `AI-Sessions/wiki/`
- schema: `AGENTS.md`, `CLAUDE.md`, `CHATGPT.md`
- catalog/index: `index.md`
- chronological log: `log.md`

### 실무형 확장 원칙

1. 위키는 채팅 기록 저장소가 아니라 실행 지식 저장소다.
2. 에이전트는 raw를 읽되 직접 수정하지 않는다.
3. 질문 결과도 장기 가치가 있으면 wiki 문서로 다시 편입한다.
4. 가치가 없거나 검증되지 않은 내용은 conversations handoff에만 남긴다.
5. 민감정보는 원문 승격 대신 규칙과 상태만 남긴다.

### 고정 명령 세트

- `reference`: 현재 맥락 복원
- `ingest`: raw를 읽고 wiki로 정리
- `save`: 장기 가치가 있는 내용만 저장
- `query`: 특정 주제 기준 복원
- `lint`: 구조와 품질 점검
- `handoff`: 다음 세션 인수인계

### 저장 판단 기준

wiki 저장은 아래 중 하나라도 만족할 때만 수행한다.

1. 반복 재사용 가능
2. 인수인계 필수
3. 의사결정 추적 필요
4. 반복 금지 리스크
5. 공통 규칙 또는 디자인 가이드

### 민감정보 처리

다음 정보는 wiki에 올리지 않는다.

- API key
- 비밀번호
- 토큰
- 고객 개인정보
- 수사 관련 원문
- 비공개 계약 원문
- 민감한 지갑주소 또는 트랜잭션 사건 자료

이 경우 wiki에는 원문이 아닌 처리 원칙, 상태, 의사결정만 남긴다.

## Links

- [[START_HERE]]
- [[AGENTS]]
- [[CLAUDE]]
- [[CHATGPT]]
- [[AI-Sessions/wiki/decisions/2026-06-13-contexthub-governance]]
- [[AI-Sessions/wiki/projects/transight-contexthub-setup]]

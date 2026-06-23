---
type: project
date: 2026-06-13
status: active
source: START_HERE.md, AGENTS.md, CLAUDE.md, index.md, log.md, prompts/, https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
---

# TranSight ContextHub Setup

## Summary

이 문서는 현재 repository를 회사 실무용 Obsidian AI 업무 위키로 세팅한 결과와 남은 운영 포인트를 기록한다.

## Context

초기 템플릿은 기본 뼈대는 있었지만, ChatGPT용 가이드가 없었고 `reference`, `handoff`용 프롬프트가 빠져 있었다.

또한 Karpathy LLM Wiki의 누적형 위키 철학을 실무 프로세스와 직접 연결하는 설명이 부족했다.

## Details

### 이번 세팅에서 반영한 것

- `CHATGPT.md` 신규 작성
- `prompts/reference.md`, `prompts/handoff.md` 신규 작성
- `START_HERE.md`, `AGENTS.md`, `CLAUDE.md`에 5가지 저장 필터와 민감정보 정책 보강
- `index.md`에 운영 문서와 신규 프롬프트 링크 추가
- `log.md`에 이번 셋업 작업 기록 추가
- `.gitignore`에 민감 구역용 ignore 패턴 추가

### 현재 운영 기준

- 원본은 `AI-Sessions/raw/`
- 정제 지식은 `AI-Sessions/wiki/`
- 세션 handoff는 `AI-Sessions/conversations/`
- index 우선 탐색, log로 최근 변경 확인
- 중요한 질의 결과도 재사용 가치가 있으면 wiki로 편입

### 다음 운영 포인트

1. 실제 프로젝트 원문 자료를 root가 아니라 `AI-Sessions/raw/` 기준으로 모으는 규칙을 정착시킬 것
2. 첫 실제 ingest 이후 `sources/`, `decisions/`, `errors/`를 프로젝트 맥락에 맞게 채울 것
3. 정기적으로 `lint`를 수행해 민감정보와 stale 문서를 점검할 것

## Links

- [[AI-Sessions/wiki/design/agent-wiki-operating-model]]
- [[AI-Sessions/wiki/decisions/2026-06-13-contexthub-governance]]
- [[START_HERE]]
- [[AGENTS]]
- [[CLAUDE]]
- [[CHATGPT]]

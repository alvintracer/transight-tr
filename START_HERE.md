# START_HERE.md

이 문서는 TranSight TR 저장소에서 AI 에이전트가 가장 먼저 읽어야 하는 프로젝트 진입 가이드입니다.

## 이 저장소의 성격

이 저장소는 두 층으로 구성됩니다.

1. 실제 제품 코드와 문서  
`src/`, `supabase/`, `docs/`, `scripts/`

2. AI 업무 위키 / ContextHub  
`AI-Sessions/`, `index.md`, `log.md`, `AGENTS.md`, `CLAUDE.md`, `CHATGPT.md`

즉, 이 프로젝트는 단순 템플릿이 아니라 **실제 TranSight TR 제품 저장소 안에 AI 업무 위키가 내장된 구조**입니다.

## 가장 먼저 읽을 문서

```text
1. README.md
2. AGENTS.md
3. CLAUDE.md 또는 CHATGPT.md
4. index.md
5. log.md
6. docs/TRANSIGHT_PROJECT_CONTEXT.md
7. docs/ttr-api-specification.md
8. docs/ko/index.md
9. 관련 AI-Sessions/wiki/ 문서
10. 필요한 경우 raw 또는 핵심 코드
```

## 프로젝트 핵심 요약

- 제품명: `TranSight TR`
- 목적: 거래소, 해외 VASP, 은행/핀테크를 연결하는 Travel Rule Hub
- 차별점: `Atomic KYT Gate`로 위험 거래는 PII 전송 전에 차단
- 구조: `Supabase Edge Functions + PostgreSQL + Protocol Adapter Layer`
- 주요 어댑터: `code`, `sumsub`, `gtr`, `transight`, `direct`
- 상태: GTR adapter, KYT gate, transfer 상태 머신까지 포함한 최신 문서/코드가 존재

## 에이전트 작업 원칙

- root 문서와 `docs/`는 최신 프로젝트 설명의 기준선이다.
- wiki에는 장기 재사용 가치가 있는 요약, 결정, 리스크, 코드 맥락만 저장한다.
- `AI-Sessions/raw/`는 원본성 자료 전용으로 유지한다.
- 실제 제품 변경과 ContextHub 변경을 혼동하지 않는다.

## 자주 쓰는 명령 키워드

```text
reference
= 현재 프로젝트 맥락 복원

ingest
= docs, raw, 코드에서 재사용 가능한 내용을 wiki로 승격

save
= 이번 작업의 장기 가치가 있는 결과를 저장

query
= 특정 주제의 기존 맥락 검색

lint
= wiki 구조, 누락, 민감정보, stale 문서 점검

handoff
= 다음 에이전트가 이어받을 수 있게 세션 상태 정리
```

## 첫 작업 추천

새 세션이라면 아래 순서가 가장 안전합니다.

1. `reference`로 현재 wiki 맥락 확인
2. `docs/TRANSIGHT_PROJECT_CONTEXT.md`와 `docs/ttr-api-specification.md` 확인
3. 관련 핵심 코드 확인
4. 필요 시 `ingest`로 문서/코드 내용을 wiki에 반영

## ingest 실행 규칙

`ingest 해줘` 요청 시 기본 순서는 아래와 같습니다.

1. `AI-Sessions/raw/`에 새로 추가된 자료 확인
2. raw 원본 미수정
3. `AI-Sessions/wiki/sources/`, `concepts/`, `decisions/`, `projects/` 등에 정리
4. `index.md` 업데이트
5. `log.md`에 ingest 기록 추가
6. 민감정보 비승격 여부 간단 점검
7. `scripts/sync-context-to-master.sh`가 있으면 `bash scripts/sync-context-to-master.sh`로 실행해 master-context 동기화

## Windows 환경 메모

- 기본 셸은 Windows PowerShell입니다.
- `.sh` 스크립트는 `bash scripts/...` 형태로 실행합니다.
- `nano`는 사용하지 않습니다.

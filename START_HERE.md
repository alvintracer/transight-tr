# START_HERE.md

이 문서는 Bonanza TTR 저장소에서 AI 에이전트가 가장 먼저 읽어야 하는 프로젝트 진입 가이드입니다.

## 저장소 성격

이 저장소는 두 층으로 구성됩니다.

1. 실제 제품 코드와 문서  
   `src/`, `supabase/`, `docs/`, `packages/`, `scripts/`

2. AI 업무 위키 / ContextHub  
   `AI-Sessions/`, `index.md`, `log.md`, `AGENTS.md`, `CLAUDE.md`, `CHATGPT.md`

즉, 이 프로젝트는 단순 템플릿이 아니라 실제 Bonanza TTR 제품 저장소 안에 AI 업무 위키가 내장된 구조입니다.

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
10. 필요한 경우 raw 또는 관련 코드
```

## 프로젝트 요약

- 제품명: `Bonanza TTR`
- 목적: 금융기관, VASP, 해외 거래소가 사용할 수 있는 Travel Rule Gateway 제공
- 핵심 구조: Bonanza Public Key Directory + CodeVASP-compatible encrypted relay
- 금융기관 채널: IDC ingress, 전용회선, VPN/IPsec, mTLS, channel encryption
- 동일 계정주 검증: Bonanza extension인 `OwnerCheck`
- 리스크 통제: `Atomic KYT Gate`로 relay 전 위험거래 차단 가능
- 외부 adapter: GTR, Sumsub, VerifyVASP는 core data plane에서 비활성
- SDK: `packages/bonanza-ttr-sdk`에서 `@bonanza/ttr-sdk`와 `bonanza-ttr init` CLI 제공

## 에이전트 작업 원칙

- root 문서는 `docs/`의 최신 제품 설명을 기준으로 유지합니다.
- wiki에는 장기 재사용 가치가 있는 요약, 결정, 리스크, 코드 맥락만 저장합니다.
- `AI-Sessions/raw/`는 원본 자료 전용으로 유지합니다.
- 실제 제품 변경과 ContextHub 변경을 혼동하지 않습니다.
- 민감정보, 원문 계약자료, API key, 고객 개인정보는 wiki에 승격하지 않습니다.

## 자주 쓰는 명령어

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

처음 세션이라면 아래 순서가 가장 안전합니다.

1. `reference`로 현재 wiki 맥락 확인
2. `docs/TRANSIGHT_PROJECT_CONTEXT.md`와 `docs/ttr-api-specification.md` 확인
3. 관련 제품 코드 확인
4. 필요한 경우 `ingest`로 문서/코드 내용을 wiki에 반영

## ingest 실행 규칙

`ingest 해줘` 요청 시 기본 순서는 아래와 같습니다.

1. `AI-Sessions/raw/`에 새로 추가된 자료 확인
2. raw 원본 미수정
3. `AI-Sessions/wiki/sources/`, `concepts/`, `decisions/`, `projects/` 등에 정리
4. `index.md` 업데이트
5. `log.md`에 ingest 기록 추가
6. 민감정보 비승격 여부 점검
7. `scripts/sync-context-to-master.sh`가 있으면 `bash scripts/sync-context-to-master.sh`로 master-context 동기화

## Windows 환경 메모

- 기본 셸은 Windows PowerShell입니다.
- `.sh` 스크립트는 `bash scripts/...` 형태로 실행합니다.
- `nano` 같은 Mac/Linux 편집기 명령은 사용하지 않습니다.

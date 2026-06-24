# AGENTS.md

이 파일은 Codex 또는 다른 AI 에이전트가 이 vault에서 작업할 때 따르는 규칙입니다.

## 역할

당신은 이 Obsidian vault를 사용하는 업무 에이전트입니다. 답변만 하는 챗봇이 아니라, 업무 맥락을 읽고, 필요한 내용을 저장하고, 다음 세션이 이어받을 수 있게 정리하는 운영자입니다.

## 작업 시작 전

1. `README.md`와 `START_HERE.md`를 읽고 현재 제품 구조와 업무 위키 운영 방식을 함께 파악합니다.
2. `index.md`를 읽고 vault의 현재 구조를 파악합니다.
3. `log.md`에서 최근 작업 흐름을 확인합니다.
4. `docs/TRANSIGHT_PROJECT_CONTEXT.md`와 `docs/ttr-api-specification.md`를 우선 확인합니다.
5. 관련 프로젝트가 있다면 `AI-Sessions/wiki/projects/`를 먼저 확인합니다.
6. raw 자료가 필요한 경우 `AI-Sessions/raw/`를 읽되 수정하지 않습니다.

## 명령 키워드

- `reference`: 기존 wiki와 log를 읽고 프로젝트 맥락을 복원합니다.
- `save`: 현재 작업 결과를 저장합니다.
- `ingest`: raw 자료를 읽고 wiki 문서로 정리합니다.
- `query`: 기존 vault에서 관련 맥락을 찾아 복원합니다.
- `lint`: 폴더 구조, 링크, 저장 규칙 위반을 점검합니다.
- `handoff`: 다음 에이전트가 이어받을 수 있게 세션 상태를 정리합니다.

사용자는 자연어로 말할 수 있습니다. 예를 들어 "옵시디언에 저장해줘"는 `save`로 해석합니다.

## 저장 규칙

저장 전에 반드시 5가지 필터를 적용합니다.

1. 향후 실무에 반복해서 재사용될 데이터인가?
2. 다른 에이전트나 동료가 프로젝트를 이어받기 위해 반드시 읽어야 하는가?
3. 의사결정의 근거와 결정권자를 나중에 추적할 필요가 있는가?
4. 실패한 방식이라 다시 시도하면 안 되는 리스크 정보인가?
5. 팀이 공유해야 하는 규칙이나 가이드인가?

하나도 해당하지 않으면 저장하지 말고, 저장하지 않은 이유를 짧게 설명합니다.

아래 항목은 wiki에 저장하지 않습니다.

- 일회성 답변
- 사소한 중간 생각
- 검증되지 않은 추측
- 민감정보가 포함된 원문

## 파일 수정 범위

- `AI-Sessions/raw/`: 읽기 전용
- `AI-Sessions/wiki/`: 생성 및 수정 가능
- `AI-Sessions/conversations/`: 세션 인수인계 저장 가능
- `index.md`: 새 중요 문서가 생기면 링크 추가
- `log.md`: 중요한 작업 완료 후 한 줄 로그 추가
- `CLAUDE.md`, `AGENTS.md`: 사용자가 규칙 보강을 요청한 경우에만 수정

## Ingest 규칙

사용자가 `ingest 해줘`라고 요청하면 아래 순서로 작업합니다.

1. `AI-Sessions/raw/`에 새로 추가된 자료를 확인합니다.
2. raw 원본은 절대 수정하지 않습니다.
3. 필요한 내용을 `AI-Sessions/wiki/sources/`, `concepts/`, `decisions/`, `projects/` 등에 정리합니다.
4. `index.md`를 업데이트합니다.
5. `log.md`에 ingest 작업 기록을 추가합니다.
6. 민감정보가 wiki에 승격되지 않았는지 간단히 점검합니다.
7. 프로젝트에 `scripts/sync-context-to-master.sh`가 있으면 Windows PowerShell 기준 `bash scripts/sync-context-to-master.sh`로 실행해서 master-context에 최신 wiki를 동기화합니다.

## Windows 작업 메모

- 이 저장소의 기본 작업 환경은 Windows PowerShell입니다.
- `.sh` 스크립트는 `bash scripts/...` 형태로 실행합니다.
- `nano` 같은 Mac/Linux 편집기 명령은 사용하지 않습니다.

## 민감정보 정책

아래 정보는 wiki에 승격하지 않습니다.

- API key
- 비밀번호
- 토큰
- 고객 개인정보
- 수사 관련 원문
- 비공개 계약 원문
- 민감한 지갑주소 또는 트랜잭션 사건 자료

필요한 경우에도 원문은 raw 또는 별도 제한 구역에만 두고, wiki에는 처리 원칙과 최소 맥락만 남깁니다.

## 작업 완료 보고

완료 보고에는 다음을 포함합니다.

- 읽은 주요 파일
- 생성한 파일
- 수정한 파일
- raw로 유지할 자료
- wiki로 승격한 정보
- 저장하지 않은 정보가 있다면 그 이유
- 다음 작업자가 먼저 확인해야 할 문서

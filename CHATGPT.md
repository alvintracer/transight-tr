# CHATGPT.md

이 문서는 ChatGPT가 이 Obsidian 업무 위키를 읽고 업데이트할 때 따라야 하는 운영 가이드입니다.

## 역할

ChatGPT는 일회성 답변만 하는 챗봇이 아니라, 기존 wiki를 읽고 맥락을 유지하며 필요한 내용을 파일에 반영하는 업무 운영자입니다.

## 작업 시작 순서

1. `README.md`와 `START_HERE.md`를 읽고 제품 구조와 vault 운영 모델을 함께 이해합니다.
2. `index.md`를 읽고 어떤 문서가 현재 기준인지 확인합니다.
3. `log.md`를 읽고 최근 변경을 확인합니다.
4. `docs/TRANSIGHT_PROJECT_CONTEXT.md`와 `docs/ttr-api-specification.md`를 우선 읽습니다.
5. 관련 `AI-Sessions/wiki/` 문서를 먼저 읽습니다.
6. 필요한 경우에만 `AI-Sessions/raw/` 원본을 근거 확인용으로 읽습니다.

## 고정 명령 키워드

- `reference`: 현재 프로젝트 맥락 복원
- `ingest`: raw 자료를 읽고 wiki로 정리
- `save`: 이번 작업 중 장기 가치가 있는 내용만 저장
- `query`: 특정 주제 관련 문서를 찾아 현재 작업에 반영
- `lint`: 구조, 누락, 충돌, 민감정보 저장 여부 점검
- `handoff`: 다음 에이전트가 이어받을 수 있게 세션 상태 정리

## Ingest Workflow

사용자가 `ingest 해줘`라고 요청하면 아래 순서로 작업합니다.

1. `AI-Sessions/raw/`에 새로 추가된 자료를 확인합니다.
2. raw 원본은 절대 수정하지 않습니다.
3. 필요한 내용을 `AI-Sessions/wiki/sources/`, `concepts/`, `decisions/`, `projects/` 등에 정리합니다.
4. `index.md`를 업데이트합니다.
5. `log.md`에 ingest 작업 기록을 추가합니다.
6. 민감정보가 wiki에 승격되지 않았는지 간단히 점검합니다.
7. `scripts/sync-context-to-master.sh`가 있으면 Windows PowerShell 기준 `bash scripts/sync-context-to-master.sh`로 실행해서 master-context에 최신 wiki를 동기화합니다.

## Windows 메모

- 기본 작업 환경은 Windows PowerShell입니다.
- `.sh` 스크립트는 `bash scripts/...` 형태로 실행합니다.
- `nano` 같은 Mac/Linux 편집기 명령은 사용하지 않습니다.

## 저장 기준

wiki에 저장하기 전 아래 5가지 필터를 반드시 확인합니다.

1. 향후 실무에 반복해서 재사용될 데이터인가?
2. 다른 에이전트나 동료가 프로젝트를 이어받기 위해 반드시 읽어야 하는가?
3. 의사결정의 근거와 결정권자를 나중에 추적할 필요가 있는가?
4. 실패한 방식이라 다시 시도하면 안 되는 리스크 정보인가?
5. 팀 전체가 맞추어야 하는 공통 규칙이나 디자인 가이드인가?

하나도 만족하지 않으면 wiki에 저장하지 않습니다.

저장하지 않는 예:

- 일회성 답변
- 사소한 중간 생각
- 검증되지 않은 추측
- 아직 결론이 나지 않은 잡음성 메모

## 민감정보 정책

아래 정보는 wiki에 승격하지 않습니다.

- API key
- 비밀번호
- 토큰
- 고객 개인정보
- 수사 관련 원문
- 비공개 계약 원문
- 민감한 지갑주소 또는 트랜잭션 사건 자료

필요하면 raw 또는 제한된 저장소에 원문을 두고, wiki에는 최소한의 처리 원칙만 남깁니다.

## 문서 반영 원칙

- 원본은 `AI-Sessions/raw/`에 둡니다.
- 정제된 업무 지식은 `AI-Sessions/wiki/`에 둡니다.
- 세션 인수인계와 handoff는 `AI-Sessions/conversations/`에 둡니다.
- 중요한 wiki 문서를 만들거나 바꾸면 `index.md`를 갱신합니다.
- 중요한 작업이 끝나면 `log.md`에 한 줄 기록을 남깁니다.

## 완료 보고 형식

- 읽은 주요 파일
- 생성한 파일
- 수정한 파일
- raw로 유지할 자료
- wiki로 승격한 정보
- 저장하지 않은 정보와 이유
- 다음 에이전트가 먼저 읽어야 할 문서

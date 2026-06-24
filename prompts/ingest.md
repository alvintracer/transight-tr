# Ingest Prompt

```text
ingest 해줘.

아래 순서로 작업해줘.

1. AI-Sessions/raw/에 새로 추가된 자료를 확인해줘.
2. raw 원본은 절대 수정하지 마.
3. 필요한 내용을 AI-Sessions/wiki/sources/, concepts/, decisions/, projects/ 등에 정리해줘.
4. index.md를 업데이트해줘.
5. log.md에 ingest 작업 기록을 추가해줘.
6. 민감정보가 wiki에 승격되지 않았는지 간단히 점검해줘.
7. 프로젝트에 scripts/sync-context-to-master.sh가 있으면 Windows PowerShell 기준 `bash scripts/sync-context-to-master.sh`로 실행해서 master-context에 최신 wiki를 동기화해줘.

반드시 아래를 구분해줘.

- 원본 자료 요약
- 반복 재사용 가능한 개념
- 의사결정으로 승격할 내용
- 프로젝트 맥락에 반영할 내용
- 검증되지 않아 wiki에 승격하지 않을 내용

민감정보, 고객 개인정보, 비공개 원문, 사건 자료는 wiki에 승격하지 말고 raw로 유지해줘.
```

# First Setup Prompt

```text
현재 폴더는 Obsidian AI 업무 위키 / ContextHub 템플릿이야.

먼저 이 템플릿의 폴더 구조와 아래 파일을 읽고 현재 규칙을 파악해줘.

- START_HERE.md
- AGENTS.md
- CLAUDE.md
- CHATGPT.md
- index.md
- log.md
- prompts/
- AI-Sessions/raw/
- AI-Sessions/conversations/
- AI-Sessions/wiki/

그 다음 아래 Karpathy LLM Wiki gist를 읽고 핵심 설계를 학습해줘.
https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f

템플릿 구조와 Karpathy 원칙을 비교해서, 현재 폴더를 내 업무에 맞는 Obsidian 기반 AI 에이전트 업무 위키로 세팅해줘.

목표는 개인 메모장이 아니라 회사 실무에서 여러 AI 에이전트가 같은 업무 맥락을 공유하는 안정적인 비즈니스 프로세스야.

raw, wiki, conversations, index.md, log.md, Claude Code용 CLAUDE.md, Codex/Antigravity용 AGENTS.md, ChatGPT용 CHATGPT.md가 올바르게 구성되어 있는지 점검하고 보강해줘.

사람이 읽는 가이드라인은 한국어로 작성하고, 에이전트가 실행하는 명령 키워드는 save, ingest, query, reference, lint, handoff처럼 영어로 고정해줘.

또한 에이전트가 정보를 저장하기 전에 아래 5가지 필터를 반드시 적용하도록 규칙에 포함해줘.

1. 향후 실무에 반복해서 재사용될 데이터인가?
2. 다른 에이전트나 동료가 프로젝트를 이어받기 위해 반드시 읽어야 하는가?
3. 의사결정의 근거와 결정권자를 나중에 추적할 필요가 있는가?
4. 실패한 방식이라 다시 시도하면 안 되는 리스크 정보인가?
5. 팀 전체가 맞추어야 하는 공통 규칙이나 디자인 가이드인가?

이 조건 중 하나도 만족하지 않는 일회성 답변, 사소한 중간 생각, 검증되지 않은 추측은 wiki에 저장하지 않도록 해줘.

민감정보 정책도 추가해줘.
API key, 비밀번호, 토큰, 고객 개인정보, 수사 관련 원문, 비공개 계약 원문, 민감한 지갑주소/트랜잭션 사건 자료는 wiki에 승격하지 않도록 해줘.

작업이 끝나면 아래 형식으로 보고해줘.

- 읽은 주요 파일
- 생성한 파일
- 수정한 파일
- raw로 유지할 자료
- wiki로 승격한 정보
- 저장하지 않은 정보와 이유
- 다음 에이전트가 먼저 읽어야 할 문서
```

# Agent Work Log

이 파일은 에이전트 작업 로그입니다.

중요한 save, ingest, query, lint 작업만 한 줄씩 추가합니다.

형식:

```text
YYYY-MM-DD HH:mm | command | summary | linked files
```

## Log

2026-06-13 10:10 | save | ChatGPT 공유용 템플릿 문서 3종 정리 | [[AI-Sessions/wiki/projects/chatgpt-share-01-overview]], [[AI-Sessions/wiki/projects/chatgpt-share-02-structure]], [[AI-Sessions/wiki/projects/chatgpt-share-03-rules-and-prompts]]
2026-06-13 13:06 | save | 회사 업무용 ContextHub 운영 규칙, ChatGPT 가이드, reference and handoff 프롬프트 보강 | [[AI-Sessions/wiki/design/agent-wiki-operating-model]], [[AI-Sessions/wiki/decisions/2026-06-13-contexthub-governance]], [[AI-Sessions/wiki/projects/transight-contexthub-setup]]
2026-06-13 13:30 | ingest | docs 주요 md와 핵심 코드를 기준선으로 루트 문서 최신화 및 초기 wiki ingest 수행 | [[AI-Sessions/wiki/sources/2026-06-13-product-docs-and-code-baseline]], [[AI-Sessions/wiki/projects/transight-tr-current-overview]], [[AI-Sessions/wiki/design/transight-tr-runtime-architecture]], [[AI-Sessions/wiki/dev-tasks/transight-tr-core-code-map]], [[AI-Sessions/wiki/decisions/2026-06-13-transight-runtime-baseline]]
2026-06-13 13:36 | save | ingest 작업 규칙에 raw 확인, 민감정보 점검, sync-context-to-master 실행 규칙 추가 | [[AGENTS]], [[CLAUDE]], [[CHATGPT]], [[START_HERE]], [[prompts/ingest]]
2026-06-13 14:33 | save | Windows PowerShell 기준 sh 실행 방식과 nano 비사용 규칙 반영 | [[AGENTS]], [[CLAUDE]], [[CHATGPT]], [[START_HERE]], [[prompts/ingest]]
2026-06-24 16:10 | save | Phase 4 to 7 implementation reality reflected into wiki: response API, security layer, live KYT controls, adapter expansion, and E2E runbook | [[AI-Sessions/wiki/sources/2026-06-24-runtime-and-ops-refresh]], [[AI-Sessions/wiki/projects/transight-tr-june-2026-delivery-status]], [[AI-Sessions/wiki/decisions/2026-06-24-phase-7-implementation-baseline]], [[AI-Sessions/wiki/projects/transight-tr-current-overview]], [[AI-Sessions/wiki/design/transight-tr-runtime-architecture]], [[AI-Sessions/wiki/dev-tasks/transight-tr-core-code-map]]
2026-08-05 09:30 | save | VerifyVASP 정식 국내 구축 파트너/트래블룰 게이트웨이 모델에 대한 망분리, 클라우드, 외부위탁, enclave 통제 구조 분석 저장 | [[AI-Sessions/wiki/projects/2026-08-05-vv-travel-rule-gateway-regulatory-architecture]]
2026-08-07 09:20 | save | VV raw 자료 검토 후 보난자 DMZ/게이트웨이 내 managed enclave 배치 시 E2E 경계와 PII 수탁자 리스크를 기존 VV 게이트웨이 문서에 추가 | [[AI-Sessions/wiki/projects/2026-08-05-vv-travel-rule-gateway-regulatory-architecture]]
2026-08-07 09:45 | save | VV 공개 개발문서 기준 Chainalysis Sanction/KYT 및 Refinitiv WCO optional Screening API 범위와 BYOK 미확인 사항을 VV 게이트웨이 문서에 추가 | [[AI-Sessions/wiki/projects/2026-08-05-vv-travel-rule-gateway-regulatory-architecture]]
2026-08-07 10:20 | save | VV Enclave API 9종, VASP API 4+1 구조, 평문/암호문 경계, 원형 Enclave 래핑과 Split Enclave 선택지 판단을 VV 게이트웨이 문서에 추가 | [[AI-Sessions/wiki/projects/2026-08-05-vv-travel-rule-gateway-regulatory-architecture]]
2026-08-07 10:45 | save | BF IDC에 VV Enclave를 설치·운영하는 구조를 확정하고, production 기본안을 Hub Gateway + 기관별 전용 Enclave로 결정 | [[AI-Sessions/wiki/decisions/2026-08-07-vv-bf-managed-enclave-idc-baseline]]
2026-08-09 06:47 | save | enclave_API.docx 재검토를 반영해 VV Enclave 옵션1 Gateway/Router와 옵션2 Proxy 구조, Mermaid 아키텍처/시퀀스 다이어그램, FI별 Enclave 분리 결론을 설계 문서로 정리 | [[AI-Sessions/wiki/design/2026-08-09-vv-enclave-deployment-options]]
2026-08-10 08:43 | save | VV의 no-BF-data-plane 피드백을 반영해 기존 BF IDC Gateway/Proxy 옵션을 상용 기본안에서 제외하고 FI DMZ-hosted Enclave + direct VV Central 통신을 새 기준안으로 정리 | [[AI-Sessions/wiki/decisions/2026-08-10-vv-no-bf-data-plane-pivot]]
2026-08-11 15:54 | save | 카카오뱅크 MT 전문처리/외부통신 선례가 VV Enclave DMZ 구조에 적용 가능한지 SWIFT/ISO20022, 전자금융감독규정, 비조치의견 기준으로 판단 정리 | [[AI-Sessions/wiki/decisions/2026-08-11-vv-swift-mt-precedent-applicability]]
2026-08-11 17:22 | save | 카카오페이가 금융기관 DMZ 내 VV Enclave를 직접 설치해 VV Central과 직접 연동하는 Mermaid 구조도와 시퀀스 다이어그램 작성 | [[AI-Sessions/wiki/design/2026-08-11-kakaopay-vv-dmz-direct-integration]]
2026-08-11 17:26 | save | 카카오페이-VV 직접 연동 문서에서 보난자 운영 역할을 제거하고 기술자문만 남기며 Mermaid 구조도와 시퀀스 다이어그램을 4:3 슬라이드 친화형으로 조정 | [[AI-Sessions/wiki/design/2026-08-11-kakaopay-vv-dmz-direct-integration]]
2026-08-12 15:08 | save | VerifyName이 non-obliged VASP 대상 계정주 동일성 확인 프로토콜이며 name+DOB salted hash 비교와 Enclave/API 구현을 필요로 한다는 구조 해석 정리 | [[AI-Sessions/wiki/concepts/2026-08-12-vv-verifyname-protocol-interpretation]]
2026-08-21 17:24 | save | TTR을 CodeVASP 호환 Core, Bonanza Registry/Public Key Relay, IDC 금융기관 Gateway, Cloud VASP API, OwnerCheck 중심으로 단순 재설계하는 구현 플랜 작성 | [[AI-Sessions/wiki/design/2026-08-21-ttr-codevasp-core-redesign-plan]]
2026-08-21 17:36 | save | CodeVASP/TTR에는 standalone 동일 계정주 확인 서비스가 없었고 OwnerCheck는 신규 capability라는 판단과 CodeVASP 문서 보유/추가 필요 자료를 core redesign plan에 반영 | [[AI-Sessions/wiki/design/2026-08-21-ttr-codevasp-core-redesign-plan]]
2026-08-21 17:46 | save | CodeVASP GitHub 원본 기준 public key Ed25519 원본 저장 및 X25519 derive 구조, OwnerCheck namespace, 이름/DOB 비교 정책을 core redesign plan에 확정 반영 | [[AI-Sessions/wiki/design/2026-08-21-ttr-codevasp-core-redesign-plan]]
2026-08-21 18:20 | save | Bonanza TTR CodeVASP-core redesign을 코드와 문서에 반영: transfer-auth 자동 승인 제거, VASP 공개키 directory 강화, OwnerCheck 신규 함수/테이블 추가, API spec/README/context 재작성 | [[AI-Sessions/wiki/design/2026-08-21-ttr-codevasp-core-redesign-plan]], [[docs/ttr-api-specification]], [[docs/TRANSIGHT_PROJECT_CONTEXT]]
2026-08-21 18:55 | save | Updated Bonanza TTR docs site, API detail pages, landing pages, internal strategy docs, and archived legacy adapter docs | [[docs/ttr-api-specification]], [[docs/TRANSIGHT_PROJECT_CONTEXT]], [[AI-Sessions/wiki/design/2026-08-21-ttr-codevasp-core-redesign-plan]]
2026-08-22 08:59 | save | Added Bonanza TTR npm SDK package and onboarding CLI, updated quickstart docs, and prepared AI-Sessions/wiki changes for git push | [[packages/bonanza-ttr-sdk]], [[docs/ko/guide/quickstart]], [[AI-Sessions/wiki/design/2026-08-21-ttr-codevasp-core-redesign-plan]]
2026-08-22 10:24 | save | Fixed VitePress Korean navigation encoding and added Vercel docs deployment config for Bonanza TTR docs | [[docs/.vitepress/config]], [[vercel]]
2026-08-22 10:51 | save | Refined public docs surface copy, removed prominent CodeVASP-compatible positioning, and applied NanumSquareAC font assets to the VitePress docs site | [[docs/.vitepress/theme/style.css]], [[docs/ko/index]], [[docs/en/index]]

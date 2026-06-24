# TranSight TR

> 비대칭 브릿지 기반 금융기관 호환 트래블룰 솔루션

TranSight TR은 국내 거래소, 해외 VASP, 은행/핀테크를 하나의 Hub로 연결하는 Travel Rule 시스템입니다.  
핵심 설계는 `Atomic KYT Gate + Protocol Adapter Layer + Supabase Edge Functions` 조합이며, KYT와 TR을 하나의 API 흐름으로 처리합니다.

## 한 줄 요약

- 국내 VASP는 CODE 호환으로 연결
- 해외 VASP는 GTR, Sumsub, Direct rail로 연결
- 금융기관은 mTLS, VPN, 전용선까지 포함한 금융 보안 채널로 연결
- KYT 결과가 위험이면 PII를 보내기 전에 TR을 차단

## 현재 구현 기준

- 런타임: Supabase Edge Functions + PostgreSQL
- 주요 엔드포인트: `health`, `vasp-registry`, `transfer-auth`, `transfer-response`
- 핵심 어댑터: `code`, `sumsub`, `gtr`, `transight`, `direct`
- 준비 중 어댑터: `verifyvasp`
- 메시지 표준: IVMS101
- 암호화/서명: NaCl Box, Ed25519

## 시스템 구조

```text
VASP / Bank / Fintech
        |
        v
TranSight TR Hub
  - health
  - vasp-registry
  - transfer-auth
  - transfer-response
        |
        +-- Atomic KYT Gate
        +-- Protocol Adapter Layer
        +-- Transfer Status Machine
        +-- Audit / TTL Queue / Registry
```

## 주요 처리 흐름

### 1. 출금 TR 인가

1. 송신 기관이 `POST /transfer-auth` 호출
2. Hub가 KYT 수행
3. `BLOCK`이면 PII 미전송 상태로 즉시 종료
4. `PASS/WARN`이면 beneficiary VASP의 `alliance_name`에 따라 어댑터 선택
5. 외부 VASP 또는 금융기관으로 1차 TR 전달
6. 검증 결과를 `verified` 또는 `denied`로 반환

### 2. 온체인 후속 처리

1. 송신 기관이 `POST /transfer-auth/result`로 TXID 보고
2. 상태 머신이 `pending -> processing -> wait-confirmed -> confirmed`로 진행
3. 필요 시 취소 또는 TTL Queue 매칭 처리

### 3. 수신 응답 처리

1. 외부 솔루션 또는 내부 beneficiary가 `transfer-response` 계열 API 호출
2. 수신인 확인, 거부, beneficiary 추가 정보, webhook을 처리
3. 송신측 또는 외부 네트워크에 맞는 프로토콜로 다시 전달

## 지원 네트워크 / 레일

| 구분 | 현재 상태 | 설명 |
|------|-----------|------|
| `code` | 구현 | 국내 거래소 대상 CODE 호환 |
| `sumsub` | 구현 | 글로벌 TRUST bootstrap rail |
| `gtr` | 구현 | 해외 VASP PII verification rail |
| `transight` | 구현 | 내부 네트워크 |
| `direct` | 구현 | 개별 HTTPS/mTLS/VPN/전용선 연결 |
| `verifyvasp` | 준비 중 | 추후 별도 구현 예정 |

## 핵심 코드 위치

- `supabase/functions/transfer-auth/index.ts`: KYT + 라우팅 중심의 핵심 진입점
- `supabase/functions/transfer-response/index.ts`: 수신측 응답 처리
- `supabase/functions/vasp-registry/index.ts`: VASP 등록, 조회, 키 로테이션, 주소 검증
- `supabase/functions/_shared/protocol-adapter.ts`: 어댑터 선택 및 외부 프로토콜 브릿지
- `supabase/functions/_shared/kyt-gate.ts`: Atomic KYT 처리
- `src/types/transfer.ts`: 상태 머신 정의
- `src/services/transfer-service.ts`: Transfer CRUD, 상태 전이, TTL Queue

## 문서 우선순위

루트와 `docs/`에서 먼저 읽어야 할 문서:

1. `docs/TRANSIGHT_PROJECT_CONTEXT.md`
2. `docs/ttr-api-specification.md`
3. `docs/ko/index.md`
4. `docs/ko/guide/architecture.md`
5. `docs/ko/guide/kyt-gate.md`
6. `docs/ko/api/gtr-adapter.md`
7. `README.md`

## 시작하기

```bash
npm install
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase db query --linked -f supabase/seed.sql
npx supabase functions deploy health
npx supabase functions deploy vasp-registry
npx supabase functions deploy transfer-auth
npx supabase functions deploy transfer-response
npm run docs:dev
```

## 참고

- 프로젝트 컨텍스트: `docs/TRANSIGHT_PROJECT_CONTEXT.md`
- 최신 API 기준: `docs/ttr-api-specification.md`
- 한국어 문서 홈: `docs/ko/index.md`
- 내부 ContextHub: `index.md`

# TranSight TR — 프로젝트 컨텍스트 및 개발 로드맵

> **이 문서는 Claude CLI(Claude Code)에게 프로젝트 전반을 설명하기 위한 컨텍스트 문서입니다.**
> 새 세션 시작 시 이 파일을 먼저 읽히면 프로젝트 맥락을 즉시 파악할 수 있습니다.

---

## 1. 프로젝트 개요

### 회사
- **보난자팩토리 (Bonanza Factory)** — 한국 소재 핀테크/레그테크 기업
- 기존 서비스: **TranSight KYT** (가상자산 지갑주소 위험 판별 API, 현재 상용 운영 중)
- 기존 인프라: **TranSafer** (전자금융보조업자/VAN사로서 은행 6개·거래소 5개와 전용선 연결)

### 신규 개발 대상
**TranSight TR (Travel Rule)** — 트래블룰 솔루션 자체 구축

### 핵심 포지셔닝
> "비대칭 브릿지 기반 금융기관 호환 트래블룰 솔루션"
- 거래소(VASP): 공중망 API로 연결
- 은행(금융기관): 기존 TranSafer 전용선으로 연결
- TranSight Hub: 두 이종 채널을 브릿징하는 허브
- KYT + TR을 단일 API로 원자적(Atomic) 처리

---

## 2. 기술 스택 (확정)

```
Backend:   Supabase (PostgreSQL + Edge Functions + Auth + Realtime)
Frontend:  Vite + TypeScript (데모/대시보드용)
Language:  TypeScript (풀스택)
Crypto:    ECIES (PII 암호화), HMAC-SHA256 (DI 기반 OBM)
Standard:  IVMS101 (FATF Travel Rule 메시지 표준)
```

---

## 3. 아키텍처 구조

### 3.1 전체 시스템

```
                    ┌─────────────────────┐
                    │   외부 레지스트리    │
                    │  (CODE Hub 등)      │
                    └──────────┬──────────┘
                               │
   공중망 HTTPS (mTLS)          │          전용선/전문
   ────────────────────────────────────────────────
                               │
┌────────────┐                 │                 ┌──────────────┐
│  VASP A    │ ──────────────► │ ◄────────────── │ 금융기관     │
│ (거래소)   │ ◄────────────── │ ──────────────► │ (은행)       │
└────────────┘                 │                 └──────────────┘
                    ┌──────────┴──────────┐
                    │   TranSight Hub     │
                    │  ┌───────────────┐  │
                    │  │  GATE 1: KYT  │  │
                    │  │  GATE 2: TR   │  │
                    │  │  (Atomic)     │  │
                    │  └───────────────┘  │
                    │  ┌───────────────┐  │
                    │  │ Protocol      │  │
                    │  │ Adapter Layer │  │
                    │  └───────────────┘  │
                    └─────────────────────┘
```

### 3.2 Protocol Adapter Layer (핵심 설계)

TranSight Hub는 상대방 VASP가 어떤 TR 솔루션을 쓰든 맞춰서 보내주는 프로토콜 어댑터 구조를 가짐.

```
┌──────────────────────────────────────────────┐
│  Protocol Adapter Layer                      │
│                                              │
│  CODE 호환   → 국내 거래소 (빗썸·코인원 등) │
│  Sumsub SDK  → 해외 VASP (GTR·TRP·Sygna)   │
│  직접 API    → Bybit·Bitget (IAAN 파트너)   │
│  전용선/전문  → 은행 (기존 TranSafer 인프라)  │
│  trPayload   → 업비트 (기존 KYT API 확장)   │
└──────────────────────────────────────────────┘
```

### 3.3 보안 채널 옵션 (4가지)

수신 기관이 보안 정책에 따라 선택:
1. **HTTPS** — 일반 TLS + AES256 + OAuth (해외 VASP)
2. **mTLS** — 상호 인증서 + OAuth (간편결제사, 인터넷전문은행)
3. **VPN (IPSec)** — 암호화 터널 (보수적 은행)
4. **전용선/전문** — 물리적 분리 (TranSafer 기구축 은행)

---

## 4. TR 흐름 — 8단계 핸드셰이크

```
Step 1: 송신 VASP → Hub: KYT 조회 (walletAddress + receiverInfo)
Step 2: Hub → 송신 VASP: KYT 결과 + 수신 VASP 공개키 반환
        (BLOCK이면 여기서 종료)
Step 3: 송신 VASP → Hub: 1차 IVMS101 (송신인 정보 + 수신 지갑주소만)
        ECIES(수신 VASP 공개키) 암호화
Step 4: Hub → 수신 VASP: 채널 브릿징 (공중망 or 전용선)
Step 5: 수신 VASP → Hub → 송신 VASP: 수신인 확인 (MATCHED/NOT_MATCHED)
Step 6: 송신 VASP → Hub → 수신 VASP: 2차 IVMS101 (완전한 쌍방 정보)
Step 7: 송신 VASP → 블록체인: 온체인 송금 (Hub 미경유)
Step 8: 수신 VASP: 입금 감지 → TTL Queue 매칭 → 최종 처리
```

---

## 5. CODE VASP 호환 구현 전략

### 왜 CODE인가
- 국내 주요 거래소(빗썸·코인원·코빗·고팍스)가 CODE 사용 중
- CODE는 오픈소스 API 스펙 → 동일 규격으로 자체 구현 가능
- CODE에 "가입"하는 게 아니라, CODE "호환" Hub를 직접 만드는 것
- 기존 CODE 가입 거래소가 엔드포인트 URL만 바꾸면 TranSight에 연결 가능

### CODE 문서 위치
- API 문서: https://docs.codevasp.com/en/docs
- AI Skills (코드 샘플·스키마 포함): https://github.com/codevasp-lab/codevasp-skills
  - `skills/codevasp-core/` — Travel Rule 핵심 API, IVMS101, 암호화
  - `skills/codevasp-unhosted-wallet/` — 비수탁 지갑 검증
  - `skills/codevasp-uppsala-screening/` — 지갑 리스크 스크리닝

### CODE 문서 구조 (확인된 것)
```
Travel Rule/
  Guides/
    01-General/
      01-Integration-Process (DD → 개발 → 회원 리뷰)
      02-Communication-Scenarios
      03-Transaction-Flow (출금/입금 흐름)
      04-General-FAQ
      05-Technical-FAQ
    02-Development/          ← 실제 개발 가이드 (상세 확인 필요)
    03-Corporate-Travel-Rule/ ← 법인 TR
  API Reference/             ← 실제 엔드포인트·페이로드 (상세 확인 필요)

Unhosted Wallet/
Uppsala Screening/
```

### 핵심 API (CODE skills에서 확인된 기능)
- VASP Discovery (VASP 탐색·등록·조회)
- Transfer Authorization (전송 인가 — 출금/입금 흐름)
- IVMS101 JSON payload validation (스키마 검증)
- Encryption/Decryption (ECIES 기반)
- Corporate Travel Rule (법인 TR 흐름)
- 코드 샘플: Node.js, Python, Java, Go

---

## 6. 확정된 연동 파트너

| 구분 | 기관 | 연결 방식 | 상태 |
|------|------|-----------|------|
| 🏢 국내 VASP | 두나무(업비트) | trPayload (KYT API 확장) | 연동 합의 |
| 🏢 국내 VASP | 빗썸 | CODE 호환 | CODE 기가입 |
| 🌐 해외 VASP | 바이빗 | 직접 + IAAN | 연동 합의 |
| 🏦 은행 6개 | 케이뱅크·카카오뱅크·국민·신한·전북·하나 | 전용선/전문 | TranSafer 기구축 |
| 💳 간편결제 | 카카오페이 | mTLS API | 도입 의향 확인 |

---

## 7. 개발 로드맵 — Phase별

### Phase 0: 사전 준비 (1주)
- [ ] codevasp-skills GitHub repo 클론
- [ ] `skills/codevasp-core/` SKILL.md 및 references 분석
- [ ] docs.codevasp.com API Reference 전체 정독
- [ ] IVMS101 JSON Schema 확보 (FATF 공식 + CODE 구현체)
- [ ] Supabase 프로젝트 생성
- [ ] Vite + TypeScript 프로젝트 초기화

### Phase 1: 데이터 모델 + DB 스키마 (1~2주)
- [ ] IVMS101 TypeScript 타입 정의
  - NaturalPerson / LegalPerson
  - Originator / Beneficiary
  - TransactionInfo
- [ ] Supabase 테이블 설계
  - `vasps` — VASP 레지스트리 (id, name, endpoint, public_key, channel_type)
  - `transfers` — TR 메시지 (id, status, originator_vasp_id, beneficiary_vasp_id, ivms101_encrypted, timestamps)
  - `public_keys` — 공개키 관리 (key_id, vasp_id, public_key, algorithm, created_at, expires_at)
  - `ttl_queue` — TTL 에스크로 매칭 (match_key, transfer_data, ttl, created_at)
- [ ] Row Level Security 정책 설정
- [ ] Supabase Edge Functions 기본 구조

### Phase 2: VASP Discovery API (1주)
- [ ] `POST /api/vasps/register` — VASP 등록
- [ ] `GET /api/vasps/:id` — VASP 조회
- [ ] `GET /api/vasps/search?wallet=` — 지갑주소 기반 VASP 탐색
- [ ] `POST /api/vasps/:id/keys` — 공개키 등록
- [ ] `GET /api/vasps/:id/keys` — 공개키 조회
- [ ] `GET /api/vasps/:id/endpoint` — 엔드포인트·채널 조회

### Phase 3: Transfer Authorization API (2~3주) — 핵심
- [ ] 출금 흐름 (Originator side)
  - `POST /api/transfers/outgoing` — 출금 TR 요청 (KYT + 1차 IVMS101)
  - KYT 연동 (기존 TranSight KYT API 호출)
  - KYT BLOCK → 즉시 종료 (Atomic)
  - KYT PASS → 수신 VASP에 1차 IVMS101 전달
- [ ] 입금 흐름 (Beneficiary side)
  - `POST /api/transfers/incoming` — 수신 TR 메시지 수신
  - 수신인 확인 로직
  - 확인 응답 반환 (MATCHED / NOT_MATCHED)
- [ ] 2차 IVMS101 교환
  - 수신인 확인 완료 → 2차 IVMS101 전달
- [ ] 상태 관리
  - PENDING → ACCEPTED → COMPLETED / REJECTED / EXPIRED
- [ ] TTL Queue 매칭 (입금 감지 ↔ TR 메시지 비동기 매칭)

### Phase 4: 암호화 레이어 (1~2주)
- [ ] ECIES 키 쌍 생성 유틸리티
- [ ] IVMS101 PII 레이어 ECIES 암호화
- [ ] 메타데이터 레이어 분리 (Hub가 접근 가능한 것 vs 불가한 것)
  - Hub 접근 가능: walletAddress, amount, vaspId, trMessageId
  - Hub 접근 불가: originator.name, dateOfBirth, address (ECIES 암호화)
- [ ] 키 로테이션 지원 (구키·신키 병행 기간)

### Phase 5: Protocol Adapter Layer (2주)
- [ ] CODE 호환 어댑터
  - CODE API 스펙 동일 구조로 수신·발신 처리
  - 국내 거래소가 엔드포인트만 바꾸면 연결되는 호환성
- [ ] Sumsub TR SDK 어댑터 (해외 VASP용)
  - Sumsub SDK 통합
  - GTR(Binance), TRP, Sygna Bridge 프로토콜 지원
- [ ] 채널 라우터
  - 수신 VASP의 channel_type 조회 → 적절한 채널로 자동 전달
  - HTTPS / mTLS / VPN / 전용선 분기

### Phase 6: KYT 통합 (1주)
- [ ] 기존 TranSight KYT API 연동
- [ ] KYT 요청에 `tr` 블록 추가 시 자동 TR 처리 트리거
- [ ] `tr` 블록 없으면 기존 KYT 단독 동작 (하위 호환)
- [ ] 통합 응답 구조: `{ kytResult, trResult, finalDecision }`

### Phase 7: 테스트 + 배포 (2주)
- [ ] 단위 테스트 (Vitest)
- [ ] 통합 테스트 (전체 8단계 플로우)
- [ ] CODE 개발환경 호환 테스트
- [ ] 보안 테스트 (암호화·인증·채널 보안)
- [ ] 스테이징 배포 → 프로덕션

---

## 8. 핵심 설계 원칙 (개발 시 항상 참조)

### 8.1 Atomic 처리
```
KYT BLOCK → TR 전송 중단. 어떤 경우에도 위험 주소로 PII가 가면 안 됨.
```

### 8.2 PII 종단간 암호화
```
IVMS101 내 PII는 수신 VASP 공개키로 ECIES 암호화.
Hub는 PII 원문을 절대 보지 않음. 메타데이터만 처리.
```

### 8.3 비대칭 브릿지
```
공중망 ↔ 전용선 채널 변환은 Hub 내부에서만 발생.
송신 기관은 수신 기관의 채널 유형을 알 필요 없음.
```

### 8.4 하위 호환
```
기존 KYT API(POST /ts/api/blacklist/wallet)는 그대로 유지.
tr 블록이 없으면 기존 KYT 단독 동작.
기존 연동 기관의 코드 변경 없음.
```

### 8.5 CODE 호환
```
CODE 가입 거래소가 엔드포인트 URL만 바꾸면 연결 가능.
CODE API 스펙과 동일한 인터페이스 제공.
추가로 KYT Atomic, 전용선 브릿지 등 CODE에 없는 기능 확장.
```

---

## 9. 참고 문서 (프로젝트 폴더 내)

| 파일 | 설명 |
|------|------|
| `TranSight_Final_Strategy_v4_3.docx` | 최종 전략 설계서 v4.3 |
| `TranSight_Strategy_Design_v1.docx` | 사업전략 + 기술설계 통합본 |
| `TR_OBM_v2.docx` | DI 기반 비식별 계정주 확인 설계서 |
| `TranSight_Patent_v2.docx` | 특허 출원 임시 명세서 |
| `transight_demo.html` | KYT+TR 데모 (HTML, 8단계 시각화) |
| `tr_obm_visual.html` | TR-OBM API 통신 3분할 시각화 |

---

## 10. 용어 정리

| 용어 | 설명 |
|------|------|
| **KYT** | Know Your Transaction — 지갑주소 위험 판별 |
| **TR** | Travel Rule — 송·수신인 PII 교환 규제 |
| **IVMS101** | Inter-VASP Messaging Standard — FATF 채택 TR 메시지 표준 |
| **OBM** | Originator-Beneficiary Match — 계정주 동일인 확인 |
| **VASP** | Virtual Asset Service Provider — 가상자산 사업자 |
| **ECIES** | 비대칭 암호화 방식 (공개키로 암호화, 개인키로 복호화) |
| **HMAC-SHA256** | 대칭키 기반 해시 (DI 수준 비식별 데이터 생성용) |
| **DI** | Duplication Information — 서비스 내에서만 유효한 식별자 (CI보다 안전) |
| **TTL Queue** | Time-To-Live 에스크로 — 온체인 입금과 TR 메시지 비동기 매칭 |
| **CODE VASP** | 한국 거래소(빗썸·코인원·코빗) 창립 오픈소스 TR 프로토콜 |
| **VV (VerifyVASP)** | 업비트 중심 폐쇄형 TR 솔루션 (Central 경유) |
| **IAAN** | 경찰청·국정원 등 정부기관의 해외 거래소 공식 협조 채널 |
| **TranSafer** | 보난자팩토리의 전자금융보조업자(VAN) 서비스. 은행·거래소 전용선 인프라 |

---

## 11. 즉시 시작 가이드
ㅌ
```bash
# 1. 프로젝트 클론/초기화
mkdir transight-tr && cd transight-tr
npm create vite@latest . -- --template vanilla-ts

# 2. Supabase CLI 설치
npm install -g supabase
supabase init
supabase start

# 3. CODE VASP skills 클론 (API 스펙 참조용)
git clone https://github.com/codevasp-lab/codevasp-skills.git ./reference/codevasp-skills

# 4. 핵심 의존성
npm install @supabase/supabase-js
npm install -D vitest typescript

# 5. 이 파일을 프로젝트 루트에 배치
# Claude CLI에서: "TRANSIGHT_PROJECT_CONTEXT.md를 읽어줘"로 시작
```

---

*이 문서는 2026년 5월 기준입니다. 프로젝트 진행에 따라 업데이트됩니다.*
*© 2026 Bonanza Factory Co., Ltd. Confidential.*

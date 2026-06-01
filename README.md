# TranSight TR

> **비대칭 브릿지 기반 금융기관 호환 트래블룰 솔루션**

CODE VASP 호환 Travel Rule Hub를 Supabase 기반으로 구축한 프로젝트입니다.
국내 거래소(CODE), 글로벌 VASP(Sumsub/TRUST), 은행(전용선)을 단일 Hub에서 브릿징합니다.

## 아키텍처

```
                      ┌──────────────────────┐
  VASP (거래소)  ──→  │    TranSight Hub     │  ←── 은행 (전용선)
  카카오페이     ──→  │                      │  ←── 해외 VASP (Sumsub)
                      │  ┌────────────────┐  │
                      │  │ GATE 1: KYT    │  │  ← Atomic Gate
                      │  │ GATE 2: TR     │  │
                      │  └────────────────┘  │
                      │  ┌────────────────┐  │
                      │  │ Protocol       │  │  ← 5개 어댑터
                      │  │ Adapter Layer  │  │
                      │  └────────────────┘  │
                      └──────────────────────┘
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | Supabase (PostgreSQL + Edge Functions) |
| Language | TypeScript / Deno (Edge Functions) |
| Crypto | NaCl Box (X25519 + XSalsa20-Poly1305), Ed25519 |
| Standard | IVMS101 (FATF Travel Rule) |
| Protocol | CODE VASP / Sumsub / Direct / VerifyVASP |
| Docs | VitePress (한국어/영어) |

## API 엔드포인트

### Edge Functions (4개)

| Function | 엔드포인트 | 역할 |
|----------|-----------|------|
| `health` | `GET /health` | 시스템 상태 + DB 연결 확인 |
| `vasp-registry` | `GET/POST/PUT/DELETE /vasp-registry` | VASP 레지스트리 CRUD |
| `transfer-auth` | `POST /transfer-auth` | 출금 TR 인가 (KYT → Protocol Adapter) |
| `transfer-response` | `POST /transfer-response` | 수신 VASP 응답 처리 |

### 주요 경로

```
# VASP Discovery
GET  /vasp-registry                          # VASP 목록 (필터: ?alliance=code)
GET  /vasp-registry?id={vaspEntityId}        # VASP 조회
POST /vasp-registry                          # VASP 등록
POST /vasp-registry/address-verify           # 지갑 주소 검증
POST /vasp-registry/rotate-key               # 키 로테이션

# Transfer Authorization (송신측)
POST /transfer-auth                          # 출금 TR 인가
POST /transfer-auth/incoming                 # 입금 TR 수신
POST /transfer-auth/result                   # TXID 보고
POST /transfer-auth/finish                   # 전송 취소
GET  /transfer-auth?id={transferId}          # 상태 조회

# Transfer Response (수신측)
GET  /transfer-response/pending              # 확인 대기 목록
POST /transfer-response/confirm              # 수신인 확인 (MATCHED)
POST /transfer-response/deny                 # 수신인 거부
POST /transfer-response/beneficiary          # 2차 IVMS101 제공
POST /transfer-response/webhook              # 외부 콜백 (Sumsub/CODE)
```

## Protocol Adapter (비대칭 브릿지)

| 어댑터 | alliance | 커버리지 |
|--------|----------|----------|
| CODE VASP | `code` | 한국 거래소 (업비트, 빗썸, 코인원...) |
| Sumsub | `sumsub` | 글로벌 (Binance, Coinbase, Bybit...) |
| TranSight | `transight` | 내부 네트워크 |
| Direct | `direct` | 개별 HTTPS/mTLS/VPN/전용선 |
| VerifyVASP | `verifyvasp` | 한국 일부 (예정) |

## 시작하기

```bash
# 1. 클론 + 의존성 설치
git clone git@github.com:alvintracer/transight-tr.git
cd transight-tr && npm install

# 2. 환경변수 설정
cp .env.example .env
# .env 파일 편집 (Supabase 키, KYT 설정 등)

# 3. Supabase Cloud 연결
npx supabase link --project-ref <your-project-ref>

# 4. DB 마이그레이션
npx supabase db push

# 5. Seed 데이터
npx supabase db query --linked -f supabase/seed.sql

# 6. Edge Functions 배포
npx supabase functions deploy health --project-ref <ref>
npx supabase functions deploy vasp-registry --project-ref <ref>
npx supabase functions deploy transfer-auth --project-ref <ref>
npx supabase functions deploy transfer-response --project-ref <ref>

# 7. API 문서 실행
npm run docs:dev

# 8. E2E 테스트
node scripts/e2e-test.mjs
```

## 프로젝트 구조

```
transight-tr/
├── src/                          # 공유 TypeScript 소스
│   ├── types/                    # IVMS101, CODE API, Transfer 타입
│   ├── utils/                    # NaCl 암호화, Ed25519 서명, IVMS101 검증
│   ├── services/                 # Transfer, Audit, TTL Queue 서비스
│   └── constants/                # 상태 enum, 에러 코드
├── supabase/
│   ├── migrations/               # DB 스키마 (vasps, transfers, public_keys...)
│   ├── seed.sql                  # 초기 데이터 (테스트 VASP)
│   └── functions/                # Edge Functions (Deno)
│       ├── _shared/              # 공유 모듈
│       │   ├── cors.ts           # CORS
│       │   ├── supabase-client.ts # DB 클라이언트
│       │   ├── protocol-adapter.ts # 비대칭 브릿지 (5 adapters)
│       │   ├── kyt-gate.ts       # KYT Atomic Gate
│       │   └── security.ts      # 보안 미들웨어
│       ├── health/               # 헬스체크
│       ├── vasp-registry/        # VASP Discovery
│       ├── transfer-auth/        # Transfer Authorization
│       └── transfer-response/    # Beneficiary Response
├── scripts/
│   └── e2e-test.mjs             # E2E 테스트 스위트
├── docs/                         # VitePress 문서 사이트
│   ├── ko/                       # 한국어
│   ├── en/                       # English
│   └── migrate.md                # 환경 구축 가이드
├── reference/                    # CODE VASP 참조 레포
├── .env.example                  # 환경변수 템플릿
└── package.json
```

## 문서

- **API Docs**: `npm run docs:dev` (VitePress, 한국어/영어)
- **마이그레이션 가이드**: `docs/migrate.md`
- **Sumsub 연동 가이드**: `docs/sumsub-adapter-guide.md`
- **프로젝트 컨텍스트**: `docs/TRANSIGHT_PROJECT_CONTEXT.md`

## 라이선스

Confidential — © 2026 Bonanza Factory Co., Ltd.

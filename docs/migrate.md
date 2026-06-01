# TranSight TR — 환경 구축 및 마이그레이션 가이드

> **목적**: 이 프로젝트를 다른 클라우드/환경에서 동일하게 재구축할 때 참조하는 문서
> 
> **마지막 업데이트**: 2026-06-01

---

## 1. 사전 요구사항

| 항목 | 버전 | 용도 |
|------|------|------|
| Node.js | ≥ 18.x | 런타임 |
| npm | ≥ 9.x | 패키지 매니저 |
| Git | ≥ 2.x | 버전 관리 |
| Supabase CLI | ≥ 2.x | DB 마이그레이션 + Edge Functions 배포 |
| TypeScript | ≥ 5.x | 타입 체크 (devDependency) |

### 선택 사항
| 항목 | 용도 |
|------|------|
| Docker | 로컬 Supabase 실행 시 필요 (`supabase start`) |
| SSH Key | GitHub 연결용 (Ed25519 권장) |

---

## 2. 프로젝트 클론 및 초기 세팅

```bash
# 1. 레포 클론
git clone git@github.com:alvintracer/transight-tr.git
cd transight-tr

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env
# .env 파일에 실제 값 입력 (아래 "환경변수" 섹션 참조)
```

---

## 3. 환경변수 설정 (.env)

```env
# === Supabase ===
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# === TranSight Hub Ed25519 키 ===
TRANSIGHT_PRIVATE_KEY=<Base64 Ed25519 signing key>
TRANSIGHT_PUBLIC_KEY=<Base64 Ed25519 verify key>
TRANSIGHT_VASP_ENTITY_ID=transight-hub

# === CODE VASP API ===
CODE_API_BASE_URL=https://trapi-dev.codevasp.com   # 개발
# CODE_API_BASE_URL=https://trapi.codevasp.com     # 프로덕션
CODE_API_VERSION=v1

# === KYT ===
KYT_API_BASE_URL=<KYT API URL>
KYT_API_KEY=<KYT API Key>
```

### Supabase 키 확인 방법
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택 → Settings → API
3. `URL`, `anon key`, `service_role key` 복사

### Ed25519 키 생성 방법
```typescript
// src/utils/nacl-crypto.ts의 generateKeyPair() 사용
import { generateKeyPair } from './src/utils/nacl-crypto.js';
const keys = generateKeyPair();
console.log('Private:', keys.privateKey);
console.log('Public:', keys.publicKey);
```

---

## 4. Supabase 프로젝트 구성

### 4.1 새 Supabase 프로젝트 생성
1. https://supabase.com/dashboard → "New Project" 클릭
2. 프로젝트 이름: `transight-tr` (또는 원하는 이름)
3. Database Password 설정 (안전하게 보관)
4. Region 선택 (한국 근접: `Northeast Asia (Tokyo)`)
5. 생성 완료 후 project-ref 확인 (URL에서 추출)

### 4.2 Supabase CLI 연결
```bash
# Supabase CLI 로그인
npx supabase login --token <access-token>

# 토큰 생성: https://supabase.com/dashboard/account/tokens

# 프로젝트 링크
npx supabase link --project-ref <project-ref>
```

### 4.3 DB 마이그레이션 적용
```bash
# 마이그레이션 push (원격 DB에 스키마 적용)
npx supabase db push

# 확인: "Applying migration 20260601000000_initial_schema.sql..." 출력
```

> ⚠️ **주의**: Supabase Cloud에서는 `uuid_generate_v4()` 대신 `gen_random_uuid()`를 사용합니다. 
> 마이그레이션 파일은 이미 `gen_random_uuid()`로 작성되어 있습니다.

### 4.4 Seed 데이터 삽입
```bash
npx supabase db query --linked -f supabase/seed.sql
```

삽입되는 데이터:
- TranSight Hub 자체 등록 (vasp_entity_id: `transight-hub`)
- 테스트 거래소 A, B (CODE 호환)
- 테스트 은행 C (전용선)

---

## 5. Edge Functions 배포

### 5.1 전체 배포
```bash
npx supabase functions deploy health --project-ref <project-ref>
npx supabase functions deploy vasp-registry --project-ref <project-ref>
npx supabase functions deploy transfer-auth --project-ref <project-ref>
```

### 5.2 배포 확인
```bash
# Health Check
curl -H "Authorization: Bearer <ANON_KEY>" \
  https://<project-ref>.supabase.co/functions/v1/health

# 기대 응답:
# { "status": "up", "service": "TranSight Hub", "version": "0.1.0", "components": { "database": "up", "vasps_registered": 4 } }

# VASP 목록
curl -H "Authorization: Bearer <ANON_KEY>" \
  https://<project-ref>.supabase.co/functions/v1/vasp-registry

# Transfer Auth (테스트)
curl -X POST -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"transferId":"test-001","currency":"BTC","amount":"0.1","payload":"test"}' \
  https://<project-ref>.supabase.co/functions/v1/transfer-auth
```

### 5.3 Edge Functions 환경변수 설정 (필요 시)
```bash
# Edge Function에서 사용하는 시크릿 설정
npx supabase secrets set TRANSIGHT_PRIVATE_KEY=<value>
npx supabase secrets set CODE_API_BASE_URL=https://trapi-dev.codevasp.com
```

---

## 6. 생성되는 DB 테이블

| 테이블 | 행 수 (초기) | 용도 |
|--------|-------------|------|
| `vasps` | 4 (seed) | VASP 레지스트리 — 거래소/은행 정보 |
| `public_keys` | 2 (seed) | Ed25519 공개키 관리 |
| `transfers` | 0 | Travel Rule 전송 메시지 |
| `ttl_queue` | 0 | TTL 에스크로 (입금↔TR 매칭) |
| `audit_log` | 0 | 감사 로그 (규제 준수) |

### RLS (Row Level Security) 정책
- **Service Role**: 모든 테이블 전체 접근 (Edge Functions용)
- **Anon**: `vasps`, `public_keys` 읽기만 허용
- **transfers, ttl_queue, audit_log**: Anon 접근 차단

---

## 7. 프로젝트 디렉토리 구조

```
transight-tr/
├── src/                          # 공유 TypeScript 소스
│   ├── types/                    # 타입 정의
│   │   ├── ivms101.ts            # IVMS101 표준 타입 (FATF)
│   │   ├── code-api.ts           # CODE VASP API 타입
│   │   ├── transfer.ts           # Transfer 상태 머신
│   │   └── vasp.ts               # VASP 레지스트리 타입
│   ├── utils/                    # 유틸리티
│   │   ├── nacl-crypto.ts        # NaCl Box 암/복호화 + Ed25519 서명
│   │   ├── signature.ts          # CODE VASP 헤더 서명
│   │   └── validators.ts         # IVMS101 런타임 검증
│   └── constants/                # 상수
│       ├── status.ts             # Transfer 상태 enum
│       └── error-codes.ts        # 에러 코드
├── supabase/
│   ├── config.toml               # Supabase 프로젝트 설정
│   ├── migrations/               # DB 마이그레이션 (순서대로 적용)
│   │   └── 20260601..._initial_schema.sql
│   ├── seed.sql                  # 초기 데이터
│   └── functions/                # Edge Functions (Deno 런타임)
│       ├── _shared/              # 공유 모듈
│       ├── health/               # GET  — 헬스체크
│       ├── vasp-registry/        # GET/POST — VASP 관리
│       └── transfer-auth/        # GET/POST — TR 전송 인가
├── reference/                    # CODE VASP 참조 레포 (git submodule)
├── docs/                         # 프로젝트 문서
├── .env.example                  # 환경변수 템플릿
├── package.json
└── tsconfig.json
```

---

## 8. 다른 클라우드로 마이그레이션 시 체크리스트

### 8.1 새 Supabase 프로젝트인 경우
- [ ] Supabase 프로젝트 생성 (섹션 4.1)
- [ ] CLI 로그인 + 프로젝트 링크 (섹션 4.2)
- [ ] `.env` 파일에 새 키 입력 (섹션 3)
- [ ] DB 마이그레이션 push (섹션 4.3)
- [ ] Seed 데이터 삽입 (섹션 4.4)
- [ ] Edge Functions 배포 (섹션 5.1)
- [ ] Health Check 확인 (섹션 5.2)
- [ ] Ed25519 키쌍 생성 + 환경변수 등록

### 8.2 Supabase 외 다른 PostgreSQL인 경우
- [ ] PostgreSQL 13+ 인스턴스 준비
- [ ] `supabase/migrations/` SQL 파일을 직접 실행
- [ ] `auth.role()` 관련 RLS 정책은 해당 플랫폼에 맞게 수정
- [ ] Edge Functions → Express/Fastify/Hono 등으로 포팅 필요
- [ ] Supabase JS Client → 직접 DB 연결(pg, Prisma 등)으로 교체

### 8.3 공통 확인 사항
- [ ] `gen_random_uuid()` 지원 여부 (PostgreSQL 13+ 필수)
- [ ] JSONB 컬럼 지원 여부
- [ ] TLS/SSL 연결 설정
- [ ] 환경변수 주입 방식 확인

---

## 9. 진행 이력

| 날짜 | 작업 | 환경 | 비고 |
|------|------|------|------|
| 2026-06-01 | Phase 0: 프로젝트 초기화 | 로컬 (Windows) | 구조 생성, 타입, 암호화 모듈 |
| 2026-06-01 | Supabase Cloud 연결 | qyyqsuzqstkhnrmyqskn | DB push + seed 완료 |
| 2026-06-01 | Edge Functions 배포 3개 | qyyqsuzqstkhnrmyqskn | health, vasp-registry, transfer-auth |
| 2026-06-01 | GitHub 연결 | alvintracer/transight-tr | SSH (ed25519) |
| 2026-06-01 | Phase 1: 서비스 레이어 | ✅ 완료 | VASP CRUD, Transfer, Audit, TTL Queue |
| 2026-06-01 | API Docs 사이트 | ✅ 완료 | VitePress (KO/EN) — `npm run docs:dev` |
| 2026-06-01 | Phase 2: VASP Discovery | ✅ 완료 | 필터, 지갑 탐색, 주소 검증, 키 로테이션 |
| 2026-06-01 | Phase 3: Transfer Auth | ✅ 완료 | 출금/입금 TR, TXID 보고, 취소, Atomic KYT Gate (stub) |
| | Phase 4: Protocol Adapter | ✅ 완료 | CODE/Direct/Internal 비대칭 브릿지, 4개 어댑터 |
| | Phase 5: KYT 연동 | ⬜ 예정 | TranSight 내부 KYT 연결 |

---

*© 2026 Bonanza Factory Co., Ltd. Confidential.*

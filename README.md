# TranSight TR

> **비대칭 브릿지 기반 금융기관 호환 트래블룰 솔루션**

CODE VASP 호환 Travel Rule API를 Supabase 기반으로 구축하는 프로젝트입니다.

## 아키텍처

```
VASP (거래소) ←── 공중망 HTTPS ──→ TranSight Hub ←── 전용선 ──→ 은행 (금융기관)
                                       │
                                  ┌────┴────┐
                                  │ GATE 1  │ KYT (위험 판별)
                                  │ GATE 2  │ TR  (트래블룰)
                                  │ Atomic  │
                                  └─────────┘
```

## 기술 스택

- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + Realtime)
- **Language**: TypeScript (풀스택)
- **Crypto**: NaCl Box (X25519 + XSalsa20-Poly1305), Ed25519 서명
- **Standard**: IVMS101 (FATF Travel Rule 메시지 표준)
- **Protocol**: CODE VASP 호환

## 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.example .env

# 3. Supabase 로컬 시작
npx supabase start

# 4. DB 마이그레이션
npx supabase db reset

# 5. Edge Functions 로컬 서빙
npx supabase functions serve
```

## 프로젝트 구조

```
transight-tr/
├── src/                    # 공유 TypeScript 소스
│   ├── types/              # IVMS101, CODE API, Transfer 타입
│   ├── utils/              # 암호화, 서명, 검증 유틸
│   └── constants/          # 상태 enum, 에러 코드
├── supabase/               # Supabase 프로젝트
│   ├── migrations/         # DB 마이그레이션
│   └── functions/          # Edge Functions (API 엔드포인트)
├── reference/              # CODE VASP 참조 레포
│   └── codevasp-skills/
├── frontend/               # Vite + TypeScript (향후)
└── docs/                   # 프로젝트 문서
```

## 라이선스

Confidential — © 2026 Bonanza Factory Co., Ltd.

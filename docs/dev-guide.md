# TranSight TR — 개발 가이드

> 이 문서는 로컬 개발 환경에서 TranSight TR을 다루는 방법을 정리합니다.

---

## 1. 우리 프로젝트 구조 이해하기

### 클라우드 (항상 돌아가고 있음)

```
┌──────────────────────────────────────────────────┐
│  Supabase Cloud                                  │
│  프로젝트: qyyqsuzqstkhnrmyqskn                  │
│                                                  │
│  📦 PostgreSQL DB    ← 데이터 저장               │
│  ⚡ Edge Functions   ← API 서버 (4개)            │
│     /health           → 시스템 상태               │
│     /vasp-registry    → VASP 등록/조회            │
│     /transfer-auth    → 출금 TR 인가              │
│     /transfer-response → 수신 VASP 응답           │
│                                                  │
│  🌐 주소: https://qyyqsuzqstkhnrmyqskn.supabase.co │
│  📊 대시보드: https://supabase.com/dashboard/project/qyyqsuzqstkhnrmyqskn │
└──────────────────────────────────────────────────┘
```

### 로컬 PC (코드 편집 + 문서 + 테스트)

```
┌──────────────────────────────────────────────────┐
│  내 PC                                           │
│                                                  │
│  📝 코드 편집 (VS Code / Cursor)                  │
│  📚 npm run docs:dev → localhost:5173 (문서 사이트)│
│  🧪 node scripts/e2e-test.mjs → 클라우드 API 테스트│
│  🚀 supabase functions deploy → 클라우드에 반영    │
│  📦 git push → GitHub 백업                        │
└──────────────────────────────────────────────────┘
```

### 핵심 포인트

- **백엔드(API) 서버**는 Supabase Cloud에서 이미 돌아가고 있음
- 로컬에서 "서버를 띄울" 필요가 없음
- 코드를 수정하면 `deploy` 명령어로 클라우드에 반영하면 끝
- Docker는 **로컬에서 미니 Supabase를 띄울 때**만 필요 (우리는 안 씀)

---

## 2. 자주 쓰는 명령어

### 📚 API 문서 사이트 (VitePress)

```bash
# 로컬에서 문서 사이트 실행 (localhost:5173)
npm run docs:dev

# 문서 빌드 (배포용)
npm run docs:build
```

### 🧪 E2E 테스트

```bash
# 전체 테스트 실행 (25개 테스트 케이스)
node scripts/e2e-test.mjs

# 다른 환경 테스트 (나중에 새 클라우드 구축 시)
node scripts/e2e-test.mjs --base-url https://새프로젝트.supabase.co/functions/v1
```

### 🚀 코드 수정 → 배포

```bash
# 1. 코드 수정 후 특정 함수만 배포
npx supabase functions deploy health --project-ref qyyqsuzqstkhnrmyqskn
npx supabase functions deploy vasp-registry --project-ref qyyqsuzqstkhnrmyqskn
npx supabase functions deploy transfer-auth --project-ref qyyqsuzqstkhnrmyqskn
npx supabase functions deploy transfer-response --project-ref qyyqsuzqstkhnrmyqskn

# 2. 전체 함수 한번에 배포
npx supabase functions deploy --project-ref qyyqsuzqstkhnrmyqskn
```

### 🔑 시크릿(환경변수) 설정

```bash
# Edge Function에서 쓰는 환경변수를 클라우드에 설정
npx supabase secrets set KYT_API_BASE_URL=https://api.transight.io
npx supabase secrets set KYT_API_KEY=your-key-here
npx supabase secrets set SUMSUB_APP_TOKEN=sbx:xxx
npx supabase secrets set SUMSUB_SECRET_KEY=xxx

# 현재 설정된 시크릿 확인
npx supabase secrets list
```

### 📦 Git (코드 백업)

```bash
git add -A
git commit -m "내용 설명"
git push
```

---

## 3. API 직접 호출 (테스트)

### PowerShell (Windows)

```powershell
# Health Check
$headers = @{Authorization="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5eXFzdXpxc3RraG5ybXlxc2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODAwNDcsImV4cCI6MjA4MzI1NjA0N30.k-fm8CaeqdkJLwxcEQo8XeCjpLZd34K-l2m-7fovxic"}
Invoke-RestMethod -Uri "https://qyyqsuzqstkhnrmyqskn.supabase.co/functions/v1/health" -Headers $headers

# VASP 목록 조회
Invoke-RestMethod -Uri "https://qyyqsuzqstkhnrmyqskn.supabase.co/functions/v1/vasp-registry" -Headers $headers | ConvertTo-Json -Depth 5
```

### cURL (Mac/Linux, 나중에 Mac 돌아갔을 때)

```bash
# Health Check
curl -H "Authorization: Bearer <ANON_KEY>" \
  https://qyyqsuzqstkhnrmyqskn.supabase.co/functions/v1/health

# VASP 목록
curl -H "Authorization: Bearer <ANON_KEY>" \
  https://qyyqsuzqstkhnrmyqskn.supabase.co/functions/v1/vasp-registry
```

---

## 4. 개발 워크플로우

```
코드 수정 → 배포 → 테스트 → 커밋

구체적으로:
1. VS Code에서 코드 수정
   (예: supabase/functions/transfer-auth/index.ts)

2. 해당 함수만 배포
   npx supabase functions deploy transfer-auth --project-ref qyyqsuzqstkhnrmyqskn

3. E2E 테스트로 검증
   node scripts/e2e-test.mjs

4. 문제 없으면 커밋
   git add -A && git commit -m "fix: 뭐뭐 수정" && git push
```

---

## 5. 주요 환경 정보

| 항목 | 값 |
|------|---|
| Supabase Project Ref | `qyyqsuzqstkhnrmyqskn` |
| API Base URL | `https://qyyqsuzqstkhnrmyqskn.supabase.co/functions/v1` |
| Dashboard | [https://supabase.com/dashboard/project/qyyqsuzqstkhnrmyqskn](https://supabase.com/dashboard/project/qyyqsuzqstkhnrmyqskn) |
| GitHub | [https://github.com/alvintracer/transight-tr](https://github.com/alvintracer/transight-tr) |
| ANON KEY | `.env` 파일 참조 |

---

## 6. npm run dev는 왜 안 돼?

`package.json`에서 `npm run dev`는 `supabase start`로 설정되어 있습니다.

`supabase start`는 **내 PC에 미니 Supabase를 통째로 설치하는 명령어**인데,
이걸 하려면 **Docker Desktop**이라는 프로그램이 필요합니다.

Docker = 내 PC 안에 가상 서버(리눅스 컨테이너)를 만드는 프로그램

근데 **우리는 이걸 할 필요가 없습니다.**
진짜 Supabase Cloud에 이미 전부 올려놓고 거기서 돌아가고 있으니까요.

> 로컬 개발이 필요한 경우 (오프라인 개발, DB 스키마 변경 테스트 등)에만
> Docker Desktop을 설치하면 됩니다.
> 
> Docker Desktop 설치: https://docs.docker.com/desktop/install/windows-install/

---

## 7. Mac에서 다시 개발할 때

Mac에서는 Docker Desktop이 더 쉽게 동작합니다:

```bash
# Docker Desktop 설치 (Homebrew)
brew install --cask docker

# Docker 실행 후
npm run dev    # ← Mac에서는 이게 됩니다
```

하지만 여전히 Cloud 방식이 더 편합니다. deploy + test 사이클이 빠르니까요.

---

*© 2026 Bonanza Factory Co., Ltd.*

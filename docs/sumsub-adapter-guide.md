# Sumsub Travel Rule Adapter 연동 가이드

> **작성일**: 2026-06-01
> **상태**: 구현 완료, 크레덴셜 연결 대기

---

## 개요

TranSight Hub의 Protocol Adapter에 **Sumsub Travel Rule** 어댑터가 추가되었습니다.
Sumsub은 **TRUST 프로토콜 게이트웨이**로 동작하여, 글로벌 VASP(Binance, Coinbase, Bybit 등)와의 TR 메시지 교환을 지원합니다.

---

## 인증 방식

| 항목 | 내용 |
|------|------|
| 방식 | HMAC-SHA256 |
| 헤더 | `X-App-Token`, `X-App-Access-Ts`, `X-App-Access-Sig` |
| 서명 대상 | `timestamp + method + uri + body` |
| 시간 오차 | ±1분 이내 |

### 서명 생성 코드
```typescript
const data = `${timestamp}${method}${uri}${body}`;
const sig = HMAC_SHA256(secretKey, data); // hex lowercase
```

---

## API 엔드포인트

### TR 전송 (출금)
```http
POST /resources/applicants/{applicantId}/kyt/txns/-/data
```

**요청 본문:**
```json
{
  "type": "travelRule",
  "txnId": "transfer-uuid",
  "txnDate": "2026-06-01T14:00:00Z",
  "direction": "out",
  "amount": 0.5,
  "currencyCode": "BTC",
  "props": {
    "direction": "out",
    "originatorVaspEntityId": "transight-hub",
    "beneficiaryVaspEntityId": "bybit",
    "beneficiaryVaspName": "Bybit",
    "address": "0x12345...",
    "payload": "Base64EncryptedIVMS101",
    "tradePrice": "50000000",
    "tradeCurrency": "KRW",
    "isExceedingThreshold": true
  }
}
```

### TXID 보고
```http
PATCH /resources/kyt/txns/{txnId}/data
```
```json
{
  "props": { "txid": "0xabc...", "vout": "0", "status": "confirmed" }
}
```

### 취소
```http
PATCH /resources/kyt/txns/{txnId}/data
```
```json
{
  "props": { "status": "canceled", "reasonType": "...", "reasonMsg": "..." }
}
```

---

## 실제 라우팅 흐름

### 카카오페이 → Bybit 예시

```
카카오페이 (우리 VASP 고객)
    │
    ▼ POST /transfer-auth
┌──────────────────────────────────────────┐
│  TranSight Hub                           │
│                                          │
│  1. 요청 수신                              │
│  2. KYT Gate (TranSight 내부 KYT)         │
│  3. Bybit → alliance: sumsub 확인         │
│  4. SumsubAdapter 자동 선택               │
│  5. HMAC 서명 + Sumsub API 호출           │
└──────────────┬───────────────────────────┘
               │
         ┌─────▼─────┐
         │  Sumsub    │ ← HMAC-SHA256 인증
         │  API       │
         └─────┬─────┘
               │
         ┌─────▼─────┐
         │  TRUST     │ ← 글로벌 TR 프로토콜
         │  Protocol  │
         └─────┬─────┘
               │
         ┌─────▼─────┐
         │  Bybit     │ → "0x12 우리 유저 맞아요"
         └───────────┘
```

---

## 환경변수

```env
# Sumsub Travel Rule (TRUST 프로토콜)
SUMSUB_APP_TOKEN=sbx:xxx...      # Dashboard → API → App Token
SUMSUB_SECRET_KEY=xxx...         # Dashboard → API → Secret Key
SUMSUB_API_BASE_URL=https://api.sumsub.com
SUMSUB_APPLICANT_ID=             # Hub의 Sumsub Applicant ID
```

### Edge Function에 시크릿 주입
```bash
npx supabase secrets set SUMSUB_APP_TOKEN=<value>
npx supabase secrets set SUMSUB_SECRET_KEY=<value>
npx supabase secrets set SUMSUB_APPLICANT_ID=<value>
```

---

## 비동기 처리

Sumsub은 TRUST를 통해 수신 VASP에 비동기 요청을 보냅니다.

| 응답 상태 | 의미 | Hub 처리 |
|-----------|------|----------|
| `completed` / `approved` | 수신 VASP 인가 | → `verified` |
| `rejected` / `declined` | 수신 VASP 거부 | → `denied` |
| `pending` | 비동기 처리 중 | → `verified` (임시) |

> `pending` 상태에서는 Sumsub Webhook을 통해 최종 결과를 수신합니다.
> Webhook 연동은 Phase 6에서 구현 예정입니다.

---

## 어댑터 현황 (5개)

| 어댑터 | alliance | 커버리지 | 상태 |
|--------|----------|----------|------|
| **CODE** | `code` | 한국 거래소 (업비트, 빗썸, 코인원...) | ✅ 구현 완료 |
| **Sumsub** | `sumsub` | 글로벌 (Binance, Coinbase, Bybit...) | ✅ 구현 완료 |
| **TranSight** | `transight` | 내부 네트워크 | ✅ 구현 완료 |
| **Direct** | `direct` | 개별 HTTPS/mTLS/VPN/전용선 | ✅ 구현 완료 |
| **VerifyVASP** | `verifyvasp` | 한국 일부 (Lambda256) | 🔧 예정 |

---

## 구현 파일

| 파일 | 역할 |
|------|------|
| `supabase/functions/_shared/protocol-adapter.ts` | SumsubAdapter 클래스 |
| `.env.example` | Sumsub 환경변수 템플릿 |

---

*© 2026 Bonanza Factory Co., Ltd. Confidential.*

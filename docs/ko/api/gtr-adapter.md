# GTR Adapter

GTR (Global Travel Rule) Adapter는 해외 주요 VASP(Binance, OKX, Bybit 등)와의 PII Verification을 위한 프로토콜 어댑터입니다.

::: tip Bootstrap Rail
GTR은 TTR의 초기 글로벌 커버리지 확보를 위한 bootstrap rail입니다. 향후 주요 해외 VASP와의 Direct Rail 구축 시 fallback으로 전환됩니다.
:::

## 개요

| 항목 | 값 |
|------|-----|
| **Alliance** | `gtr` |
| **암호화** | Curve25519 (E2E) |
| **인증** | X-API-KEY |
| **API** | GTR One-Step PII Verification |
| **PII** | Hub 비열람 — 암호문 그대로 전달 |

## 사용 방법

GTR Adapter는 `beneficiaryVaspEntityId`의 `alliance_name`이 `gtr`일 때 자동으로 선택됩니다. 추가로 `adapterOptions.gtr`를 통해 세부 파라미터를 제어할 수 있습니다.

### 요청 예시

```json
POST /transfer-auth
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "currency": "ETH",
  "amount": "1.25",
  "tradePrice": "4500000",
  "tradeCurrency": "KRW",
  "payload": "Base64EncodedCurve25519EncryptedIVMS101==",
  "address": "0x339facb1...",
  "network": "ETH",
  "beneficiaryVaspEntityId": "binance",
  "originatorVaspEntityId": "hana-bank",
  "adapterOptions": {
    "gtr": {
      "mode": "PII_VERIFICATION",
      "verifyDirection": 2,
      "targetVaspCode": "BNC001",
      "expectVerifyFields": ["110026", "110025"]
    }
  }
}
```

### `adapterOptions.gtr` 파라미터

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `mode` | `string` | `PII_VERIFICATION` | 검증 모드 (Phase 1) |
| `verifyDirection` | `number` | `2` | `2`=Pre-transaction, `1`=Post-transaction |
| `targetVaspCode` | `string` | DB 조회 | GTR VASP 코드 |
| `initiatorPublicKey` | `string` | 환경변수 | 송신측 Curve25519 공개키 |
| `targetVaspPublicKey` | `string` | DB 조회 | 수신측 Curve25519 공개키 |
| `expectVerifyFields` | `string[]` | `['110026','110025']` | 검증할 PII 필드 코드 |
| `payloadFormat` | `string` | — | `GTR_CURVE25519_ENCRYPTED` |
| `lawThresholdEnabled` | `boolean` | `false` | 법정 기준금액 초과 여부 |

### 검증 필드 코드

| 코드 | 대상 | 설명 |
|------|------|------|
| `110026` | 자연인 | 수취인 이름 |
| `110025` | 자연인 | 수취인 생년월일 |
| `111001` | 법인 | 법인명 |
| `111022` | 법인 | 법인 등록 국가 |

## 응답 매핑

GTR 검증 결과는 자동으로 TTR 표준 응답으로 변환됩니다.

### 성공 (verified)

```json
{
  "result": "verified",
  "transferId": "550e8400-...",
  "payload": "Base64EncodedGtrResponsePayload==",
  "kyt": { "decision": "pass", "riskScore": 12 },
  "adapter": { "protocol": "gtr", "latencyMs": 812 }
}
```

### 이름 불일치 (denied)

```json
{
  "result": "denied",
  "reasonType": "INPUT_NAME_MISMATCHED",
  "reasonMsg": "GTR PII verification mismatch: 110026",
  "adapter": { "protocol": "gtr", "latencyMs": 650 }
}
```

### GTR 응답 → TTR 결과 매핑 규칙

| GTR verify field status | TTR result | reasonType |
|---|---|---|
| 전부 `status=1` (일치) | `verified` | — |
| `status=2` (불일치) — 이름 | `denied` | `INPUT_NAME_MISMATCHED` |
| `status=2` (불일치) — DOB | `denied` | `DOB_MISMATCHED` |
| `status=4` (필수 누락) | `denied` | `LACK_OF_INFORMATION` |
| `status=3` (미지원) | `denied` | `GTR_FIELD_NOT_SUPPORTED` |
| API 에러 | `denied` | `GTR_SERVICE_ERROR` |
| 타임아웃 (10초) | `denied` | `CHANNEL_TIMEOUT` |

::: danger Fail-Closed 정책
GTR Adapter는 **fail-closed** 정책을 적용합니다. 검증 미완료(pending), 타임아웃, 에러 시 모두 `denied`로 처리됩니다. 금융기관 정책에 따른 설계입니다.
:::

## 시퀀스 다이어그램

```
금융기관         TTR Hub              KYT Gate          GtrAdapter          GTR          Binance
  │                │                    │                  │                 │              │
  │ POST /transfer │                    │                  │                 │              │
  │ -auth          │                    │                  │                 │              │
  │───────────────►│                    │                  │                 │              │
  │                │                    │                  │                 │              │
  │          [KYT Gate]────────────────►│                  │                 │              │
  │                │◄── PASS ──────────│                  │                 │              │
  │                │                    │                  │                 │              │
  │          [alliance=gtr]             │                  │                 │              │
  │                │─── One-Step ──────────────────────────►│                │              │
  │                │   encryptedPayload(그대로 전달)        │─── verify ────►│              │
  │                │                    │                  │                 │── check ────►│
  │                │                    │                  │                 │◄── result ──│
  │                │                    │                  │◄────────────────│              │
  │                │◄──────────────────────────────────────│                 │              │
  │                │                    │                  │                 │              │
  │          [gtr_transfer_logs 기록]   │                  │                 │              │
  │◄───────────────│                    │                  │                 │              │
  │ { verified }   │                    │                  │                 │              │
```

::: warning PII Non-Disclosure
Hub는 `payload`를 복호화하지 않습니다. 금융기관이 Curve25519로 암호화한 PII는 GTR → 수신 VASP까지 E2E로 전달됩니다. Hub 로그에는 `SHA-256(payload)` 해시만 기록됩니다.
:::

## DB Schema

### gtr_vasp_profiles

GTR VASP별 설정 및 Curve25519 공개키를 관리합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `gtr_vasp_code` | `TEXT` | GTR 내 VASP 식별 코드 |
| `target_public_key` | `TEXT` | Curve25519 공개키 |
| `target_public_key_expires_at` | `TIMESTAMPTZ` | 키 만료 시점 |
| `support_pre_transaction` | `BOOLEAN` | Pre-transaction 지원 |
| `pii_verification_support` | `TEXT[]` | 지원 검증 필드 |
| `status` | `TEXT` | `active` / `pending` / `disabled` |

### gtr_transfer_logs

GTR 전송별 감사 로그. **PII 원문을 저장하지 않습니다.**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `gtr_request_id` | `TEXT` | `TTR-{transferId}` |
| `gtr_travelrule_id` | `TEXT` | GTR 발급 ID |
| `verify_direction` | `INTEGER` | 2=Pre, 1=Post |
| `verify_status` | `INTEGER` | GTR 상태 코드 |
| `verify_fields` | `JSONB` | 필드별 검증 결과 |
| `request_payload_hash` | `TEXT` | SHA-256 해시 |
| `latency_ms` | `INTEGER` | 응답 시간 (ms) |

## 환경 변수

| 변수 | 설명 |
|------|------|
| `GTR_API_BASE_URL` | GTR API 엔드포인트 |
| `GTR_API_KEY` | GTR API Key |
| `GTR_PUBLIC_KEY` | TTR Hub Curve25519 공개키 |
| `GTR_PRIVATE_KEY` | TTR Hub Curve25519 비밀키 |

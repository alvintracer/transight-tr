# TranSight Travel Rule (TTR) — API 명세서

**Version**: 1.1.0  
**Last Updated**: 2026-06-06  
**Base URL**: `https://{SUPABASE_PROJECT_REF}.supabase.co/functions/v1`  
**Protocol**: HTTPS + mTLS (금융기관) / HTTPS + Ed25519 서명 (거래소)  
**인코딩**: UTF-8, JSON  
**인증**: Ed25519 헤더 서명 (CODE VASP 호환)  

---

## 목차

1. [시스템 아키텍처](#1-시스템-아키텍처)
2. [인증 및 보안](#2-인증-및-보안)
3. [API 엔드포인트 총괄](#3-api-엔드포인트-총괄)
4. [VASP Registry API](#4-vasp-registry-api)
5. [Transfer Authorization API](#5-transfer-authorization-api)
6. [Health Check API](#6-health-check-api)
7. [데이터 모델 (DB Schema)](#7-데이터-모델-db-schema)
8. [IVMS101 포맷](#8-ivms101-포맷)
9. [NaCl 암호화/복호화](#9-nacl-암호화복호화)
10. [에러 코드](#10-에러-코드)
11. [Transfer 상태 머신](#11-transfer-상태-머신)
12. [KYT Atomic Gate](#12-kyt-atomic-gate)
13. [Protocol Adapter (라우팅)](#13-protocol-adapter-라우팅)
14. [시퀀스 다이어그램](#14-시퀀스-다이어그램)

---

## 1. 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────────────┐
│                        TranSight TR Hub                             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ vasp-registry│  │transfer-auth │  │   health     │  Edge Funcs  │
│  │  (Discovery) │  │(Atomic Gate) │  │  (Health)    │              │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘              │
│         │                 │                                          │
│  ┌──────┴─────────────────┴──────────────────────────┐              │
│  │              _shared Modules                       │              │
│  │  ┌───────────┐ ┌────────────┐ ┌──────────────────┐│              │
│  │  │ kyt-gate  │ │ protocol-  │ │    security      ││              │
│  │  │ (Atomic)  │ │  adapter   │ │  (Sig Verify)    ││              │
│  │  └───────────┘ └────────────┘ └──────────────────┘│              │
│  └───────────────────────────────────────────────────┘              │
│                           │                                          │
│  ┌────────────────────────┴──────────────────────────┐              │
│  │              Supabase PostgreSQL                   │              │
│  │  vasps | public_keys | transfers | ttl_queue |    │              │
│  │  audit_log | kyt_tr_block_registry                │              │
│  │  gtr_vasp_profiles | gtr_transfer_logs            │              │
│  └───────────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────────┘
         ▲                    ▲                    ▲              ▲
         │ 전용선/VPN         │ HTTPS              │ HTTPS        │ HTTPS
         │ (LEASED_LINE)      │ (mTLS)             │              │ (X-API-KEY)
    ┌────┴─────┐         ┌───┴────┐          ┌────┴──────┐  ┌───┴─────┐
    │ 금융기관  │         │ 거래소  │          │  외부 TR   │  │  GTR    │
    │(하나은행) │         │(빗썸)  │          │ (CODEVASP) │  │(Global) │
    └──────────┘         └────────┘          └───────────┘  └─────────┘
```

### 기술 스택

| 레이어 | 기술 |
|--------|------|
| **API Gateway** | Supabase Edge Functions (Deno) |
| **Database** | PostgreSQL 15 (Supabase) |
| **암호화** | NaCl Box (X25519-XSalsa20-Poly1305) |
| **서명** | Ed25519 |
| **IVMS** | IVMS101 v2020 |

---

## 2. 인증 및 보안

### 2.1 요청 헤더 (CODE VASP 호환)

모든 API 요청에는 다음 헤더가 포함되어야 합니다:

| 헤더 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `X-Code-Req-Datetime` | string | ✅ | ISO8601 UTC datetime (예: `2024-03-04T15:10Z`) |
| `X-Code-Req-Nonce` | string | ✅ | 랜덤 논스 (100초 이내 중복 불가) |
| `X-Code-Req-PubKey` | string | ✅ | 자신의 Ed25519 공개키 (Base64) |
| `X-Code-Req-Remote-PubKey` | string | ❌ | 수신 VASP 공개키 (암호화 API에서만) |
| `X-Code-Req-Signature` | string | ✅ | Ed25519 서명 (Base64) |
| `X-Request-Origin` | string | ✅ | `{allianceName}:{vaspEntityId}` (예: `transight:hana-bank`) |

### 2.2 서명 생성 규칙

```
SignatureData = concat(
    bytes(X-Code-Req-Datetime),    // UTF-8 인코딩
    bytes(RequestBody),             // JSON string UTF-8 인코딩
    BigEndian4Bytes(Nonce)          // 4바이트 Big-Endian unsigned int
)

Signature = Ed25519.sign(SignatureData, PrivateKey)
```

**서명 검증 흐름:**

```
1. X-Request-Origin에서 vaspEntityId 파싱
2. DB에서 해당 VASP의 활성 공개키 조회
3. X-Code-Req-PubKey와 DB 공개키 일치 확인
4. SignatureData 재구성
5. Ed25519.verify(SignatureData, Signature, PublicKey)
6. Nonce 중복 체크 (100초 윈도우)
```

### 2.3 채널 유형별 보안

| 채널 | 대상 | 인증 | 암호화 |
|------|------|------|--------|
| `HTTPS` | 해외 VASP, 거래소 | TLS 1.3 + Ed25519 서명 | NaCl Box E2E |
| `mTLS` | 간편결제사, 인터넷전문은행 | 상호 인증서 + Ed25519 | NaCl Box E2E |
| `VPN` | 보수적 금융기관 | IPSec 터널 + Ed25519 | NaCl Box E2E |
| `LEASED_LINE` | TranSafer 기구축 은행 | 전용선 물리 보안 + Ed25519 | NaCl Box E2E |

---

## 3. API 엔드포인트 총괄

### Edge Functions

| Method | Endpoint | 설명 |
|--------|----------|------|
| **VASP Registry** | | |
| `GET` | `/vasp-registry` | VASP 목록 조회 (필터 지원) |
| `GET` | `/vasp-registry?id={vaspEntityId}` | 특정 VASP 조회 (공개키 포함) |
| `GET` | `/vasp-registry?wallet={address}` | 지갑 주소 기반 VASP 탐색 |
| `POST` | `/vasp-registry` | VASP 등록 |
| `PUT` | `/vasp-registry` | VASP 정보 업데이트 |
| `DELETE` | `/vasp-registry?id={vaspEntityId}` | VASP 삭제 |
| `POST` | `/vasp-registry/rotate-key` | 공개키 로테이션 |
| `POST` | `/vasp-registry/address-verify` | 수신인 주소 검증 |
| **Transfer Auth** | | |
| `POST` | `/transfer-auth` | 출금 TR 인가 요청 (핵심) |
| `POST` | `/transfer-auth/incoming` | 입금 TR 수신 |
| `GET` | `/transfer-auth?id={transferId}` | Transfer 상태 조회 |
| `POST` | `/transfer-auth/result` | 전송 결과 보고 (TXID) |
| `POST` | `/transfer-auth/finish` | 전송 취소 |
| **Health** | | |
| `GET` | `/health` | 시스템 상태 확인 |

---

## 4. VASP Registry API

### 4.1 GET — VASP 목록 조회

```
GET /vasp-registry?alliance={code|verifyvasp|transight|sumsub|direct|gtr}
                  &country={ISO-3166-1}
                  &search={검색어}
```

**Response (200)**

```json
{
  "vasps": [
    {
      "vaspEntityId": "bithumb",
      "vaspName": "Bithumb",
      "vaspLegalName": "Bithumb Korea Co., Ltd.",
      "countryOfRegistration": "KR",
      "allianceName": "code",
      "health": "up",
      "channelType": "HTTPS",
      "pubkeys": [
        {
          "pubkey": "Base64EncodedEd25519PublicKey==",
          "expiresAt": "2025-12-31T23:59:59Z"
        }
      ]
    }
  ],
  "total": 1
}
```

---

### 4.2 GET — 단일 VASP 조회

```
GET /vasp-registry?id=bithumb
```

**Response (200)**

```json
{
  "id": "uuid-...",
  "vasp_entity_id": "bithumb",
  "vasp_name": "Bithumb",
  "vasp_legal_name": "Bithumb Korea Co., Ltd.",
  "country_of_registration": "KR",
  "alliance_name": "code",
  "endpoint_url": "https://trapi.codevasp.com/v1/code/transfer/bithumb",
  "channel_type": "HTTPS",
  "health": "up",
  "metadata": {},
  "public_keys": [
    {
      "id": "uuid-...",
      "public_key": "Base64EncodedEd25519PublicKey==",
      "algorithm": "Ed25519",
      "expires_at": "2025-12-31T23:59:59Z",
      "is_active": true,
      "created_at": "2024-01-15T00:00:00Z"
    }
  ]
}
```

---

### 4.3 GET — 지갑 주소 기반 VASP 탐색

```
GET /vasp-registry?wallet=0x1234abcd...
```

**Response (200)**

```json
{
  "found": true,
  "wallet": "0x1234abcd...",
  "candidates": [
    {
      "vaspEntityId": "binance",
      "vaspName": "Binance",
      "allianceName": "gtr",
      "health": "up"
    }
  ]
}
```

---

### 4.4 POST — VASP 등록

```
POST /vasp-registry
Content-Type: application/json
```

**Request Body**

```json
{
  "vasp_entity_id": "hana-bank",
  "vasp_name": "하나은행",
  "vasp_legal_name": "Hana Bank Co., Ltd.",
  "country_of_registration": "KR",
  "alliance_name": "transight",
  "endpoint_url": "leased-line://10.0.1.100:8443/tr",
  "channel_type": "LEASED_LINE",
  "public_key": "Base64EncodedEd25519PublicKey==",
  "public_key_expires_at": "2026-12-31T23:59:59Z"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `vasp_entity_id` | string | ✅ | 고유 식별자 |
| `vasp_name` | string | ✅ | 표시 이름 |
| `vasp_legal_name` | string | ❌ | 법적 등록명 |
| `country_of_registration` | string | ✅ | ISO 3166-1 alpha-2 |
| `alliance_name` | string | ❌ | `code` \| `verifyvasp` \| `transight` \| `sumsub` \| `direct` \| `gtr` (기본: `transight`) |
| `endpoint_url` | string | ✅ | TR API 엔드포인트 |
| `channel_type` | string | ❌ | `HTTPS` \| `mTLS` \| `VPN` \| `LEASED_LINE` (기본: `HTTPS`) |
| `public_key` | string | ✅ | Ed25519 공개키 (Base64) |
| `public_key_expires_at` | string | ❌ | 공개키 만료 시점 (ISO8601) |

**Response (201)**

```json
{
  "success": true,
  "vasp": {
    "id": "uuid-...",
    "vasp_entity_id": "hana-bank",
    "vasp_name": "하나은행",
    "health": "up",
    "created_at": "2024-06-05T10:00:00Z"
  }
}
```

---

### 4.5 PUT — VASP 정보 업데이트

```
PUT /vasp-registry
```

**Request Body**

```json
{
  "vasp_entity_id": "hana-bank",
  "health": "down",
  "endpoint_url": "leased-line://10.0.1.200:8443/tr"
}
```

**수정 가능 필드**: `vasp_name`, `vasp_legal_name`, `endpoint_url`, `channel_type`, `health`, `metadata`

---

### 4.6 DELETE — VASP 삭제

```
DELETE /vasp-registry?id=hana-bank
```

**Response (200)**

```json
{ "success": true, "deleted": "hana-bank" }
```

---

### 4.7 POST — 공개키 로테이션

```
POST /vasp-registry/rotate-key
```

**Request Body**

```json
{
  "vasp_entity_id": "hana-bank",
  "new_public_key": "NewBase64EncodedEd25519PublicKey==",
  "expires_at": "2027-06-01T00:00:00Z"
}
```

기존 활성 키 → `is_active: false` → 새 키 등록.

---

### 4.8 POST — 수신인 주소 검증

```
POST /vasp-registry/address-verify
```

**Request Body**

```json
{
  "address": "0x1234abcd...",
  "currency": "ETH",
  "beneficiaryVaspEntityId": "bithumb"
}
```

**Response (200)**

```json
{
  "verified": true,
  "address": "0x1234abcd...",
  "currency": "ETH",
  "vasp": {
    "vaspEntityId": "bithumb",
    "vaspName": "Bithumb",
    "health": "up"
  }
}
```

---

## 5. Transfer Authorization API

### 5.1 POST — 출금 TR 인가 요청 (핵심)

```
POST /transfer-auth
Content-Type: application/json
X-Code-Req-Datetime: 2024-06-05T10:00:00Z
X-Code-Req-Nonce: 1234567890
X-Code-Req-PubKey: Base64PubKey==
X-Code-Req-Signature: Base64Sig==
X-Request-Origin: transight:hana-bank
```

**Request Body**

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "currency": "BTC",
  "amount": "0.5",
  "tradePrice": "25000000",
  "tradeCurrency": "KRW",
  "isExceedingThreshold": true,
  "payload": "Base64EncodedEncryptedIVMS101==",
  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "tag": "",
  "network": "BTC",
  "beneficiaryVaspEntityId": "bithumb",
  "originatorVaspEntityId": "hana-bank",
  "adapterOptions": {
    "gtr": {
      "mode": "PII_VERIFICATION",
      "verifyDirection": 2,
      "targetVaspCode": "BINANCE_GTR_CODE",
      "expectVerifyFields": ["110026", "110025"]
    }
  }
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `transferId` | string (UUID v4) | ✅ | 고유 전송 추적 ID |
| `currency` | string | ✅ | 가상자산 심볼 (BTC, ETH, USDT 등) |
| `amount` | string | ✅ | 전송 수량 (수수료 제외 실제 전송량) |
| `tradePrice` | string | ❌ | 법정화폐 환산 금액 |
| `tradeCurrency` | string | ❌ | ISO 4217 (기본: `KRW`) |
| `isExceedingThreshold` | boolean | ❌ | 트래블룰 임계값 초과 여부 (기본: `false`) |
| `payload` | string | ✅ | **암호화된 IVMS101 payload** (Base64, NaCl Box 또는 GTR Curve25519) |
| `address` | string | ❌ | 수신인 지갑 주소 |
| `tag` | string | ❌ | Tag/Memo (XRP, XLM 등) |
| `network` | string | ❌ | 네트워크 (멀티체인 코인 구분) |
| `beneficiaryVaspEntityId` | string | ❌ | 수신 VASP 식별자 |
| `originatorVaspEntityId` | string | ❌ | 송신 VASP 식별자 |
| `adapterOptions` | object | ❌ | 어댑터별 추가 옵션 (아래 참조) |

#### `adapterOptions.gtr` (GTR Adapter 사용 시)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `mode` | string | ❌ | `PII_VERIFICATION` (기본, Phase 1) |
| `verifyDirection` | number | ❌ | `2`=Pre-transaction (기본), `1`=Post-transaction |
| `targetVaspCode` | string | ❌ | GTR VASP 코드 (없으면 DB에서 조회) |
| `initiatorPublicKey` | string | ❌ | 송신측 Curve25519 공개키 (없으면 환경변수) |
| `targetVaspPublicKey` | string | ❌ | 수신측 Curve25519 공개키 (없으면 DB) |
| `expectVerifyFields` | string[] | ❌ | 검증 필드 코드 (기본: `['110026','110025']`) |
| `payloadFormat` | string | ❌ | `GTR_CURVE25519_ENCRYPTED` |
| `lawThresholdEnabled` | boolean | ❌ | 법정 기준금액 초과 여부 사용 |

> GTR 검증 필드 코드: `110026`=수취인 이름, `110025`=수취인 생년월일, `111001`=법인명, `111022`=법인 등록국가

**Response (201) — CODE/Direct 어댑터 (verified)**

```json
{
  "result": "verified",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "beneficiaryVasp": {
    "vaspEntityId": "bithumb",
    "vaspName": "Bithumb"
  },
  "payload": "Base64EncodedResponsePayload==",
  "kyt": {
    "decision": "pass",
    "riskScore": 12
  },
  "adapter": {
    "protocol": "code",
    "latencyMs": 342
  }
}
```

**Response (201) — GTR 어댑터 (verified)**

```json
{
  "result": "verified",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "beneficiaryVasp": {
    "vaspEntityId": "binance",
    "vaspName": "Binance"
  },
  "payload": "Base64EncodedGtrResponsePayload==",
  "kyt": {
    "decision": "pass",
    "riskScore": 12
  },
  "adapter": {
    "protocol": "gtr",
    "latencyMs": 812
  }
}
```

**Response (201) — GTR 이름 불일치 (denied)**

```json
{
  "result": "denied",
  "reasonType": "INPUT_NAME_MISMATCHED",
  "reasonMsg": "GTR PII verification mismatch: 110026",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "kyt": {
    "decision": "pass",
    "riskScore": 12
  },
  "adapter": {
    "protocol": "gtr",
    "latencyMs": 650
  }
}
```

**Response (201) — KYT 차단 (denied)**

```json
{
  "result": "denied",
  "reasonType": "KYT_BLOCK",
  "reasonMsg": "KYT risk assessment blocked this transfer. PII was not transmitted.",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "kyt": {
    "decision": "block",
    "riskScore": 87,
    "riskCategory": "SANCTIONS",
    "riskLabels": ["OFAC_SDN", "darknet_market"],
    "provider": "transight_kyt"
  }
}
```

### 5.1.1 Atomic KYT Gate 흐름

```
요청 수신 → [1] 필수 필드 검증
          → [2] 중복 transferId 검사
          → [3] 송신 VASP 확인
          → [4] 수신 VASP 탐색
          → [5] KYT Gate (Atomic)
                ├── BLOCK → Transfer denied (PII 미전송) → 응답 반환
                └── PASS  → [6] Transfer 레코드 생성
                          → [7] Protocol Adapter 라우팅
                          → [8] 상태 업데이트
                          → [9] 감사 로그
                          → [10] 응답 반환
```

---

### 5.2 POST — 입금 TR 수신

```
POST /transfer-auth/incoming
```

**Request Body**

```json
{
  "transferId": "660e8400-e29b-41d4-a716-446655440001",
  "currency": "ETH",
  "amount": "10.0",
  "tradePrice": "5000000",
  "tradeCurrency": "KRW",
  "payload": "Base64EncryptedPayload==",
  "originatorVaspEntityId": "bithumb",
  "beneficiaryVaspEntityId": "hana-bank"
}
```

**Response (201)**

```json
{
  "result": "verified",
  "transferId": "660e8400-e29b-41d4-a716-446655440001",
  "message": "Incoming transfer recorded and queued for matching"
}
```

입금 수신 시 **TTL Queue**에 자동 추가됨 (매칭 키: `{beneficiaryVaspEntityId}:{currency}:{amount}`, TTL: 3600초).

---

### 5.3 GET — Transfer 상태 조회

```
GET /transfer-auth?id=550e8400-e29b-41d4-a716-446655440000
```

**Response (200)**

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "verified",
  "direction": "outgoing",
  "currency": "BTC",
  "amount": "0.5",
  "tradePrice": "25000000",
  "tradeCurrency": "KRW",
  "result": "verified",
  "reasonType": null,
  "reasonMsg": null,
  "txid": null,
  "createdAt": "2024-06-05T10:00:00Z",
  "updatedAt": "2024-06-05T10:00:01Z"
}
```

---

### 5.4 POST — 전송 결과 보고 (TXID)

```
POST /transfer-auth/result
```

**Request Body**

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "txid": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  "vout": "0"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `transferId` | string | ✅ | Transfer ID |
| `txid` | string | ✅ | 온체인 TX Hash |
| `vout` | string | ❌ | UTXO 기반 체인의 vout index |

**Response (200)**

```json
{
  "result": "success",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "txid": "0xabcdef...",
  "status": "confirmed"
}
```

> ⚠️ `verified`, `pending`, `processing` 상태에서만 결과 보고 가능.

---

### 5.5 POST — 전송 취소

```
POST /transfer-auth/finish
```

**Request Body**

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "result": "canceled",
  "reasonType": "CANCELED_BY_USER",
  "reasonMsg": "사용자 요청에 의한 취소"
}
```

**Response (200)**

```json
{
  "result": "success",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "canceled"
}
```

> ⚠️ `denied`, `canceled` (최종 상태)에서는 취소 불가.

---

## 6. Health Check API

```
GET /health
```

**Response (200)**

```json
{
  "status": "healthy",
  "timestamp": "2024-06-05T10:00:00Z",
  "services": {
    "database": "up",
    "kyt": "up"
  }
}
```

---

## 7. 데이터 모델 (DB Schema)

### 7.1 vasps — VASP 레지스트리

```sql
CREATE TABLE vasps (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vasp_entity_id          TEXT UNIQUE NOT NULL,    -- 고유 식별자 (예: "bithumb")
  vasp_name               TEXT NOT NULL,            -- 표시 이름
  vasp_legal_name         TEXT,                     -- 법적 등록명
  country_of_registration TEXT,                     -- ISO 3166-1 alpha-2
  alliance_name           TEXT NOT NULL DEFAULT 'transight',
  endpoint_url            TEXT,                     -- TR API 엔드포인트
  channel_type            TEXT NOT NULL DEFAULT 'HTTPS',
  health                  TEXT NOT NULL DEFAULT 'up',
  metadata                JSONB DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 7.2 public_keys — 공개키 관리

```sql
CREATE TABLE public_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vasp_id     UUID NOT NULL REFERENCES vasps(id) ON DELETE CASCADE,
  public_key  TEXT NOT NULL,            -- Base64 Ed25519 verify key (32 bytes)
  algorithm   TEXT NOT NULL DEFAULT 'Ed25519',
  expires_at  TIMESTAMPTZ,              -- NULL = 무기한
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 7.3 transfers — Travel Rule 전송

```sql
CREATE TABLE transfers (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id              TEXT UNIQUE NOT NULL,    -- UUID v4 (CODE transferId)
  status                   TEXT NOT NULL DEFAULT 'wait',
  direction                TEXT NOT NULL,           -- outgoing | incoming
  originator_vasp_id       UUID REFERENCES vasps(id),
  beneficiary_vasp_id      UUID REFERENCES vasps(id),
  currency                 TEXT NOT NULL,
  amount                   TEXT NOT NULL,
  trade_price              TEXT,
  trade_currency           TEXT DEFAULT 'KRW',
  is_exceeding_threshold   BOOLEAN DEFAULT false,
  payload_encrypted        TEXT,                    -- 🔒 암호화된 IVMS101 (Base64)
  ivms101_metadata         JSONB DEFAULT '{}',      -- Hub가 볼 수 있는 메타데이터만
  result                   TEXT,                    -- verified | denied
  reason_type              TEXT,
  reason_msg               TEXT,
  txid                     TEXT,
  vout                     TEXT,
  kyt_result               JSONB DEFAULT '{}',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Hub가 볼 수 있는 것** (`ivms101_metadata`): `address`, `tag`, `network`  
**Hub가 볼 수 없는 것** (`payload_encrypted`): `originator.name`, `dateOfBirth`, `placeOfBirth` 등 PII

### 7.4 ttl_queue — TTL 에스크로 매칭

```sql
CREATE TABLE ttl_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_key       TEXT NOT NULL,        -- 매칭 키 (vaspId:currency:amount)
  transfer_id     UUID REFERENCES transfers(id),
  transfer_data   JSONB NOT NULL,
  ttl_seconds     INTEGER NOT NULL DEFAULT 3600,
  matched         BOOLEAN NOT NULL DEFAULT false,
  matched_at      TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 7.5 audit_log — 감사 로그

```sql
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT NOT NULL,        -- transfer.created, vasp.registered, ...
  entity_type     TEXT NOT NULL,        -- transfer | vasp | public_key
  entity_id       UUID,
  actor_vasp_id   UUID REFERENCES vasps(id),
  details         JSONB DEFAULT '{}',
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**이벤트 타입 목록:**

| Event Type | 설명 |
|------------|------|
| `transfer.created` | Transfer 생성 |
| `transfer.authorized` | Transfer 인가 완료 |
| `transfer.kyt_blocked` | KYT에 의한 차단 |
| `transfer.status_changed` | 상태 변경 |
| `transfer.result_reported` | TXID 보고 |
| `transfer.incoming_received` | 입금 수신 |
| `transfer.canceled` | 전송 취소 |
| `vasp.registered` | VASP 등록 |
| `vasp.updated` | VASP 정보 수정 |
| `vasp.deleted` | VASP 삭제 |
| `public_key.rotated` | 공개키 로테이션 |

### 7.6 gtr_vasp_profiles — GTR VASP 프로필

```sql
CREATE TABLE gtr_vasp_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vasp_id                     UUID NOT NULL REFERENCES vasps(id) ON DELETE CASCADE,
  gtr_vasp_code               TEXT NOT NULL UNIQUE,
  gtr_legal_entity_name       TEXT,
  gtr_display_name            TEXT,
  jurisdiction                TEXT,
  target_public_key           TEXT,              -- Curve25519 공개키
  target_public_key_algorithm TEXT DEFAULT 'curve25519',
  target_public_key_expires_at TIMESTAMPTZ,
  support_pre_transaction     BOOLEAN DEFAULT true,
  support_post_transaction    BOOLEAN DEFAULT false,
  pii_verification_support    TEXT[] DEFAULT '{}',
  expected_pii_preferences    TEXT[] DEFAULT '{}',
  address_verification_supported BOOLEAN DEFAULT false,
  txid_verification_supported    BOOLEAN DEFAULT false,
  status                      TEXT NOT NULL DEFAULT 'active',
  last_synced_at              TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);
```

### 7.7 gtr_transfer_logs — GTR 전송 로그

```sql
CREATE TABLE gtr_transfer_logs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id           UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  gtr_request_id        TEXT NOT NULL,           -- TTR-{transferId}
  gtr_travelrule_id     TEXT,                    -- GTR 발급 travelruleId
  target_vasp_code      TEXT NOT NULL,
  verify_direction      INTEGER,                 -- 2=Pre, 1=Post
  verify_status         INTEGER,                 -- GTR 상태 코드
  verify_message        TEXT,
  verify_fields         JSONB DEFAULT '[]',      -- 필드별 검증 결과
  request_payload_hash  TEXT,                    -- SHA-256(encryptedPayload)
  response_payload_hash TEXT,
  latency_ms            INTEGER,
  http_status           INTEGER,
  error_code            TEXT,
  error_message         TEXT,
  created_at            TIMESTAMPTZ DEFAULT now()
);
```

> ⚠️ `gtr_transfer_logs`에는 payload 원문이 저장되지 않습니다. SHA-256 해시만 기록됩니다.

---

## 8. IVMS101 포맷

### 8.1 최상위 구조

```json
{
  "ivms101": {
    "Originator": {
      "originatorPersons": [ /* NaturalPerson 또는 LegalPerson */ ],
      "accountNumber": ["bc1q..."]
    },
    "Beneficiary": {
      "beneficiaryPersons": [ /* NaturalPerson 또는 LegalPerson */ ],
      "accountNumber": ["0x1234..."]
    },
    "OriginatingVASP": {
      "originatingVASP": { /* LegalPerson */ }
    },
    "BeneficiaryVASP": {
      "beneficiaryVASP": { /* LegalPerson */ }
    }
  }
}
```

### 8.2 NaturalPerson (자연인)

```json
{
  "naturalPerson": {
    "name": {
      "nameIdentifier": [
        {
          "primaryIdentifier": "Hong",
          "secondaryIdentifier": "Gildong",
          "nameIdentifierType": "LEGL"
        }
      ],
      "localNameIdentifier": [
        {
          "primaryIdentifier": "홍",
          "secondaryIdentifier": "길동",
          "nameIdentifierType": "LEGL"
        }
      ]
    },
    "dateAndPlaceOfBirth": {
      "dateOfBirth": "1990-01-15",
      "placeOfBirth": "KR"
    },
    "geographicAddress": [
      {
        "addressType": "HOME",
        "country": "KR",
        "townName": "Seoul",
        "addressLine": ["강남구 테헤란로 123"]
      }
    ],
    "nationalIdentification": {
      "nationalIdentifier": "900115-1234567",
      "nationalIdentifierType": "IDCD",
      "countryOfIssue": "KR"
    },
    "customerIdentification": "CUST-001234",
    "countryOfResidence": "KR"
  }
}
```

### 8.3 LegalPerson (법인)

```json
{
  "legalPerson": {
    "name": {
      "nameIdentifier": [
        {
          "legalPersonName": "TranSight Inc.",
          "legalPersonNameIdentifierType": "LEGL"
        }
      ]
    },
    "geographicAddress": [
      {
        "addressType": "BIZZ",
        "country": "KR",
        "townName": "Seoul",
        "addressLine": ["강남구 역삼동 123-45"]
      }
    ],
    "nationalIdentification": {
      "nationalIdentifier": "123-45-67890",
      "nationalIdentifierType": "LEIX",
      "countryOfIssue": "KR",
      "registrationAuthority": "RA000567"
    },
    "countryOfRegistration": "KR"
  }
}
```

### 8.4 이름 유형 코드

| 코드 | NaturalPerson | LegalPerson |
|------|--------------|-------------|
| `LEGL` | 법적 이름 | 법적 명칭 |
| `ALIA` | 별명 | - |
| `BIRT` | 출생 시 이름 | - |
| `MAID` | 결혼 전 이름 | - |
| `SHRT` | - | 약칭 |
| `TRAD` | - | 상호명 |

---

## 9. NaCl 암호화/복호화

### 9.1 알고리즘

```
키교환:  X25519 (Ed25519 → Curve25519 변환)
암호화:  XSalsa20-Poly1305 (NaCl Box)
서명:    Ed25519
```

### 9.2 암호화 흐름

```typescript
// 1. Ed25519 키쌍 생성
const keyPair = nacl.sign.keyPair();
const privateKey = base64(keyPair.secretKey);  // 64 bytes
const publicKey = base64(keyPair.publicKey);    // 32 bytes

// 2. IVMS101 payload 암호화
const ivms101 = { ivms101: { Originator: {...}, Beneficiary: {...}, ... } };
const plaintext = JSON.stringify(ivms101);

// 3. Ed25519 → Curve25519 변환
const senderCurve25519Sk = sodium.crypto_sign_ed25519_sk_to_curve25519(senderEd25519Sk);
const receiverCurve25519Pk = sodium.crypto_sign_ed25519_pk_to_curve25519(receiverEd25519Pk);

// 4. NaCl Box 암호화
const nonce = nacl.randomBytes(24);  // 24 bytes
const encrypted = nacl.box(plaintext, nonce, receiverCurve25519Pk, senderCurve25519Sk);

// 5. nonce + ciphertext 결합 → Base64
const result = concat(nonce, encrypted);
const payload = base64(result);
```

### 9.3 복호화 흐름

```typescript
// 1. Base64 디코딩
const ciphertext = fromBase64(payload);

// 2. nonce + ciphertext 분리
const nonce = ciphertext.slice(0, 24);
const message = ciphertext.slice(24);

// 3. Ed25519 → Curve25519 변환
const senderCurve25519Pk = sodium.crypto_sign_ed25519_pk_to_curve25519(senderEd25519Pk);
const receiverCurve25519Sk = sodium.crypto_sign_ed25519_sk_to_curve25519(receiverEd25519Sk);

// 4. NaCl Box 복호화
const decrypted = nacl.box.open(message, nonce, senderCurve25519Pk, receiverCurve25519Sk);
const ivms101 = JSON.parse(utf8(decrypted));
```

### 9.4 라이브러리

```json
{
  "tweetnacl": "^1.0.3",
  "tweetnacl-util": "^0.15.1",
  "libsodium-wrappers": "^0.7.13"
}
```

---

## 10. 에러 코드

### 10.1 CODE VASP 호환 거부 사유

| 코드 | 설명 |
|------|------|
| `NOT_FOUND_ADDRESS` | 지갑 주소를 찾을 수 없음 |
| `NOT_SUPPORTED_SYMBOL` | 지원하지 않는 코인 심볼 |
| `NOT_KYC_USER` | KYC 미완료 사용자 |
| `INPUT_NAME_MISMATCHED` | 수신인 이름 불일치 |
| `DOB_MISMATCHED` | 생년월일 불일치 |
| `SANCTION_LIST` | 제재 대상 |
| `LACK_OF_INFORMATION` | 정보 부족 |
| `UNKNOWN` | 기타 사유 |

### 10.2 TTR 확장 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| `AUTH_INVALID_SIGNATURE` | 401 | 서명 검증 실패 |
| `AUTH_EXPIRED_NONCE` | 401 | 논스 만료 (100초 초과) |
| `AUTH_UNKNOWN_VASP` | 401 | 미등록 VASP |
| `AUTH_KEY_MISMATCH` | 401 | 공개키 불일치 |
| `KYT_BLOCK` | 403 | KYT 위험 판정 → TR 중단 |
| `KYT_TIMEOUT` | - | KYT 서비스 타임아웃 |
| `KYT_SERVICE_ERROR` | - | KYT 서비스 오류 |
| `TRANSFER_NOT_FOUND` | 404 | Transfer 없음 |
| `TRANSFER_INVALID_STATUS` | 400 | 유효하지 않은 상태 전이 |
| `TRANSFER_EXPIRED` | - | Transfer 만료 |
| `TRANSFER_DUPLICATE` | 409 | 중복 transferId |
| `IVMS101_INVALID_PAYLOAD` | 400 | IVMS101 페이로드 오류 |
| `IVMS101_DECRYPTION_FAILED` | - | 복호화 실패 |
| `IVMS101_VALIDATION_FAILED` | 400 | IVMS101 검증 실패 |
| `VASP_NOT_FOUND` | 404 | VASP 미등록 |
| `VASP_HEALTH_DOWN` | 503 | VASP 비가용 |
| `VASP_KEY_EXPIRED` | - | 공개키 만료 |
| `CHANNEL_ROUTING_FAILED` | - | 채널 라우팅 실패 |
| `CHANNEL_TIMEOUT` | - | 채널 타임아웃 |
| `INTERNAL_ERROR` | 500 | 내부 서버 오류 |
| `INVALID_REQUEST` | 400 | 유효하지 않은 요청 |
| `RATE_LIMITED` | 429 | 요청 빈도 초과 |

### 10.3 에러 응답 형식

```json
{
  "error": "VASP_NOT_FOUND",
  "message": "Beneficiary VASP \"unknown-vasp\" not found",
  "timestamp": "2024-06-05T10:00:00.123Z"
}
```

---

## 11. Transfer 상태 머신

### 11.1 상태 코드

| 상태 | 설명 |
|------|------|
| `wait` | 수신 VASP 응답 대기 중 |
| `verified` | 수신 VASP가 인가함 (블록체인 미전송) |
| `denied` | 수신 VASP가 거부함 (최종) |
| `pending` | 블록체인 전송 전 대기 |
| `processing` | 블록체인 전송됨, 마이닝 대기 |
| `wait-confirmed` | 마이닝됨, finality 미확보 |
| `confirmed` | 블록체인 전송 완료 (TXID 업데이트) |
| `canceled` | 전송 취소 (최종) |

### 11.2 상태 전이 다이어그램

```
                    ┌──────────┐
                    │   wait   │ ── 초기 상태
                    └────┬─────┘
                         │
                ┌────────┴────────┐
                ▼                 ▼
          ┌──────────┐     ┌──────────┐
          │ verified │     │  denied  │ ── 최종 상태
          └────┬─────┘     └──────────┘
               │
          ┌────┴─────┐
          ▼          ▼
    ┌──────────┐  ┌──────────┐
    │ pending  │  │ canceled │ ── 최종 상태
    └────┬─────┘  └──────────┘
         │
         ▼
    ┌────────────┐
    │ processing │
    └─────┬──────┘
          │
          ▼
    ┌────────────────┐
    │ wait-confirmed │
    └───────┬────────┘
            │
            ▼
    ┌──────────────┐
    │  confirmed   │
    └──────────────┘
```

### 11.3 허용되는 상태 전이

```typescript
const VALID_STATUS_TRANSITIONS = {
  'wait':           ['verified', 'denied'],
  'verified':       ['pending', 'canceled'],
  'denied':         [],                       // 최종
  'pending':        ['processing', 'canceled'],
  'processing':     ['wait-confirmed', 'canceled'],
  'wait-confirmed': ['confirmed', 'canceled'],
  'confirmed':      ['canceled'],             // 극히 드문 경우 (재조직)
  'canceled':       [],                       // 최종
};
```

---

## 12. KYT Atomic Gate

### 12.1 개요

KYT(Know Your Transaction) Gate는 Transfer 인가 **전에** 수신 주소의 위험도를 자동 평가합니다. 위험 판정 시 **PII를 수신 VASP에 전송하지 않고 즉시 차단**합니다 (Atomic).

### 12.2 VASP별 KYT 설정

| 설정 | 값 | 설명 |
|------|-----|------|
| `kyt_mode` | `none` \| `kyt_only` \| `atomic` | KYT 모드 |
| `kyt_scope` | `tr_only` \| `all` | KYT 적용 범위 |
| `kyt_auto_block` | boolean | 자동 차단 활성화 |
| `kyt_return_for_sar` | boolean | SAR용 위험 정보 반환 |

### 12.3 KYT Check 결과

```json
{
  "decision": "block",
  "riskScore": 87,
  "riskCategory": "SANCTIONS",
  "riskLabels": ["OFAC_SDN", "darknet_market"],
  "provider": "transight_kyt",
  "checkedAt": "2024-06-05T10:00:00Z"
}
```

### 12.4 Block Registry

VASP별로 자동 차단할 위험 코드를 등록할 수 있습니다:

```sql
CREATE TABLE kyt_tr_block_registry (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vasp_id             UUID NOT NULL REFERENCES vasps(id),
  ra_code2            TEXT NOT NULL,          -- Risk Analysis Code (예: "RA0001")
  risk_analysis_type  TEXT,                   -- SANCTIONS, FRAUD, MONEY_LAUNDERING, ...
  max_hop_count       INTEGER,
  description         TEXT,
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

---

## 13. Protocol Adapter (라우팅)

### 13.1 개요

Protocol Adapter는 수신 VASP의 `alliance_name`에 따라 적절한 프로토콜로 라우팅합니다.

### 13.2 지원 프로토콜

| Adapter | Alliance | 프로토콜 | 상태 | 비고 |
|---------|----------|----------|------|------|
| `CodeVaspAdapter` | `code` | NaCl Box + Ed25519 헤더 서명 | ✅ 구현 | CODEVASP Hub relay |
| `SumsubAdapter` | `sumsub` | HMAC-SHA256 서명 | ✅ 구현 | Sumsub TRUST 프로토콜 |
| `VerifyVaspAdapter` | `verifyvasp` | SHA-256 이름 해시 | ⚠️ Stub | VV Central Server |
| `DirectAdapter` | `direct` | NaCl Box + Ed25519 서명 | ✅ 구현 | P2P 직접 연결 |
| `TransightInternalAdapter` | `transight` | 내부 DB 직접 처리 | ✅ 구현 | 동일 얼라이언스 내 |
| `GtrAdapter` | `gtr` | Curve25519 + X-API-KEY | ✅ 구현 | GTR One-Step PII Verification |

### 13.3 라우팅 로직

```typescript
function selectAdapter(allianceName: string): ProtocolAdapter {
  switch (allianceName) {
    case 'code':       return new CodeVaspAdapter();
    case 'sumsub':     return new SumsubAdapter();
    case 'verifyvasp': return new VerifyVaspAdapter();
    case 'direct':     return new DirectAdapter();
    case 'transight':  return new TransightInternalAdapter();
    case 'gtr':        return new GtrAdapter();
    default:           return new DirectAdapter();  // fallback
  }
}
```

### 13.4 GTR Adapter 상세

**GTR One-Step PII Verification 흐름:**

```
1. gtr_vasp_profiles에서 대상 VASP 프로필 조회
2. 공개키 만료 여부 확인
3. GTR One-Step 요청 빌드 (TTR 필드 → GTR 필드 매핑)
4. POST /api/verify/v2/one_step (10초 타임아웃)
5. GTR 응답 → TTR 결과 매핑
6. gtr_transfer_logs에 로그 기록 (SHA-256 해시만)
```

**GTR 응답 → TTR 결과 매핑:**

| GTR verify field status | TTR result | TTR reasonType |
|---|---|---|
| 전부 status=1 (일치) | `verified` | — |
| status=2 (불일치) — 이름 | `denied` | `INPUT_NAME_MISMATCHED` |
| status=2 (불일치) — DOB | `denied` | `DOB_MISMATCHED` |
| status=4 (필수 누락) | `denied` | `LACK_OF_INFORMATION` |
| status=3 (미지원) | `denied` | `GTR_FIELD_NOT_SUPPORTED` |
| API 에러 | `denied` | `GTR_SERVICE_ERROR` |
| 타임아웃 (10초) | `denied` | `CHANNEL_TIMEOUT` |

> ⚠️ GTR 어댑터는 **fail-closed 정책**을 적용합니다. 검증 미완료(pending) 시 `denied`로 처리합니다.

### 13.4 Adapter 응답 형식

```typescript
interface AdapterResponse {
  result: 'verified' | 'denied' | 'pending';
  reasonType?: string;
  reasonMsg?: string;
  payload?: string;           // 수신 VASP 응답 payload (암호문)
  protocol: string;           // 사용된 프로토콜
  latencyMs: number;          // 응답 시간 (ms)
  beneficiaryVasp?: object;   // 수신 VASP 정보
}
```

---

## 14. 시퀀스 다이어그램

### 14.1 출금 (Pre-Transaction) — 정상 흐름

```
금융기관(하나은행)         TTR Hub              KYT Gate         Protocol Adapter        수신VASP(빗썸/CODEVASP)
      │                      │                    │                    │                        │
  [1] POST /transfer-auth    │                    │                    │                        │
      { transferId,          │                    │                    │                        │
        payload(암호문),     │                    │                    │                        │
        currency, amount }   │                    │                    │                        │
      ──────────────────────►│                    │                    │                        │
      │                      │                    │                    │                        │
      │               [2] 헤더 서명 검증          │                    │                        │
      │               [3] VASP 등록 확인          │                    │                        │
      │                      │                    │                    │                        │
      │               [4] KYT Gate ──────────────►│                    │                        │
      │                      │     riskScore: 12  │                    │                        │
      │                      │◄── decision: PASS ─│                    │                        │
      │                      │                    │                    │                        │
      │               [5] Transfer 레코드 생성    │                    │                        │
      │                      │                    │                    │                        │
      │               [6] alliance=code           │                    │                        │
      │                      │─── route ─────────────────────────────►│                        │
      │                      │    POST /v1/code/transfer/bithumb      │                        │
      │                      │    { payload(암호문), headers }        │── relay ──────────────►│
      │                      │                    │                    │                        │
      │                      │                    │                    │    복호화              │
      │                      │                    │                    │    이름 매칭            │
      │                      │                    │                    │    결과 반환            │
      │                      │                    │                    │◄─────────────────────  │
      │                      │◄──────────────────────────────────────│                        │
      │                      │    result: verified                    │                        │
      │                      │                    │                    │                        │
      │               [7] 상태 업데이트 (verified)│                    │                        │
      │               [8] 감사 로그              │                    │                        │
      │                      │                    │                    │                        │
      │  ◄──────────────────│                    │                    │                        │
      │  { result: verified, │                    │                    │                        │
      │    kyt: { pass },    │                    │                    │                        │
      │    adapter: { code } }                    │                    │                        │
```

### 14.2 출금 — KYT 차단 흐름

```
금융기관                 TTR Hub              KYT Gate
      │                      │                    │
  [1] POST /transfer-auth    │                    │
      ──────────────────────►│                    │
      │                      │                    │
      │               [2] KYT Gate ──────────────►│
      │                      │   riskScore: 87    │
      │                      │◄── decision: BLOCK │
      │                      │                    │
      │               [3] Transfer denied 기록    │
      │                   (PII 미전송!)           │
      │                      │                    │
      │  ◄──────────────────│                    │
      │  { result: denied,   │                    │
      │    reasonType:       │                    │
      │      KYT_BLOCK,     │                    │
      │    kyt: {            │                    │
      │      riskScore: 87,  │                    │
      │      riskLabels:     │                    │
      │        [OFAC_SDN] }} │                    │
      │                      │                    │
      │    ⚠️ PII가 수신 VASP에 전달되지 않음    │
```

### 14.3 TXID 보고 후 완료

```
금융기관                 TTR Hub
      │                      │
  블록체인 전송 완료         │
      │                      │
  POST /transfer-auth/result │
  { transferId, txid }       │
      ──────────────────────►│
      │                      │
      │   상태: confirmed    │
      │   감사 로그 기록     │
      │                      │
      │  ◄──────────────────│
      │  { result: success,  │
      │    status: confirmed}│
```

---

### 14.4 출금 — GTR PII Verification 흐름

```
금융기관(하나은행)         TTR Hub              KYT Gate              GtrAdapter             GTR Network        Binance
      │                      │                    │                      │                      │               │
  [1] POST /transfer-auth    │                    │                      │                      │               │
      { payload(GTR암호문),  │                    │                      │                      │               │
        adapterOptions.gtr } │                    │                      │                      │               │
      ──────────────────────►│                    │                      │                      │               │
      │                      │                    │                      │                      │               │
      │               [2] KYT Gate ──────────────►│                      │                      │               │
      │                      │◄── decision: PASS ─│                      │                      │               │
      │                      │                    │                      │                      │               │
      │               [3] alliance=gtr             │                      │                      │               │
      │                      │── route ───────────────────────────────►│                      │               │
      │                      │   POST /api/verify/v2/one_step          │                      │               │
      │                      │   { encryptedPayload(그대로 전달),      │                      │               │
      │                      │     targetVaspCode, expectVerifyFields } │── verify ───────────►│               │
      │                      │                    │                      │                      │── PII check ─►│
      │                      │                    │                      │                      │◄─ result ─────│
      │                      │                    │                      │◄─────────────────────│               │
      │                      │◄──────────────────────────────────────────│                      │               │
      │                      │   verifyFields: [{status:1}, {status:1}]  │                      │               │
      │                      │                    │                      │                      │               │
      │               [4] 상태: verified           │                      │                      │               │
      │               [5] gtr_transfer_logs 기록   │                      │                      │               │
      │               [6] 감사 로그                │                      │                      │               │
      │                      │                    │                      │                      │               │
      │  ◄──────────────────│                    │                      │                      │               │
      │  { result: verified, │                    │                      │                      │               │
      │    adapter: { gtr }} │                    │                      │                      │               │
      │                      │                    │                      │                      │               │
      │  ⚠️ Hub는 payload를 복호화하지 않음       │                      │                      │               │
      │  ⚠️ PII는 금융기관→GTR→Binance E2E       │                      │                      │               │
```

---

## 부록 A: 환경 변수

| 변수 | 설명 |
|------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key |
| `SUPABASE_ANON_KEY` | Supabase Anon Key |
| `TRANSIGHT_PRIVATE_KEY` | TTR Hub Ed25519 Private Key (Base64) |
| `TRANSIGHT_VASP_ENTITY_ID` | TTR Hub VASP Entity ID |
| `KYT_API_BASE_URL` | KYT 서비스 API URL |
| `KYT_API_KEY` | KYT 서비스 API Key |
| `GTR_API_BASE_URL` | GTR API Base URL |
| `GTR_API_KEY` | GTR API Key |
| `GTR_PUBLIC_KEY` | TTR Hub Curve25519 공개키 (GTR 등록용) |
| `GTR_PRIVATE_KEY` | TTR Hub Curve25519 비밀키 (Payload 암호화용) |

## 부록 B: Row Level Security (RLS)

| 테이블 | Policy | 설명 |
|--------|--------|------|
| `vasps` | Service Role full access | Edge Functions에서 모든 접근 허용 |
| `vasps` | Public read | 익명 사용자 읽기 허용 (VASP 목록) |
| `public_keys` | Service Role full access | |
| `public_keys` | Public read | 익명 사용자 읽기 허용 |
| `transfers` | Service Role full access | |
| `ttl_queue` | Service Role full access | |
| `audit_log` | Service Role full access | |
| `gtr_vasp_profiles` | Service Role full access | |
| `gtr_transfer_logs` | Service Role full access | |

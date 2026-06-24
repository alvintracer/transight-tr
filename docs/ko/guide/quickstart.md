# 빠른 시작

5분 안에 TranSight TR의 핵심 흐름을 체험합니다.

## 사전 준비

1. TranSight Hub에 VASP로 등록
2. Ed25519 키쌍 생성 (NaCl Box 암호화용)
3. API 키 발급

## 1단계: VASP 등록

```bash
curl -X POST https://api.transight.io/v1/vasp-registry \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vaspEntityId": "my-vasp",
    "vaspName": "My Exchange",
    "allianceName": "transight",
    "endpointUrl": "https://my-exchange.com/tr/callback",
    "channelType": "HTTPS",
    "features": ["KYT", "TR"]
  }'
```

## 2단계: Ed25519 공개키 등록

```bash
curl -X POST https://api.transight.io/v1/vasp-registry/keys \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vaspEntityId": "my-vasp",
    "publicKey": "Base64EncodedEd25519PublicKey",
    "algorithm": "Ed25519"
  }'
```

## 3단계: 수신 VASP 탐색

출금하려는 지갑 주소의 VASP를 탐색합니다.

```bash
curl "https://api.transight.io/v1/vasp-registry" \
  -H "Authorization: Bearer $API_KEY"
```

## 4단계: 출금 TR 인가 요청

```bash
curl -X POST https://api.transight.io/v1/transfer-auth \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "transferId": "550e8400-e29b-41d4-a716-446655440000",
    "currency": "BTC",
    "amount": "0.5",
    "tradePrice": "50000000",
    "tradeCurrency": "KRW",
    "isExceedingThreshold": true,
    "payload": "NaClBoxEncryptedIVMS101Base64",
    "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "beneficiaryVaspEntityId": "bithumb-vasp",
    "originatorVaspEntityId": "my-vasp"
  }'
```

::: tip Atomic KYT Gate
이 요청은 자동으로 KYT 검증을 포함합니다. 위험 주소로 판정되면 PII가 외부에 전송되지 않고 즉시 `denied`됩니다.
:::

## 5단계: Transfer 상태 확인

```bash
curl "https://api.transight.io/v1/transfer-auth?id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $API_KEY"
```

## 6단계: TXID 보고 (블록체인 전송 후)

```bash
curl -X POST https://api.transight.io/v1/transfer-auth/result \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "transferId": "550e8400-e29b-41d4-a716-446655440000",
    "txid": "0xabc123...",
    "vout": "0"
  }'
```

## 전체 흐름 요약

```
[송신 VASP]                    [TranSight Hub]                [수신 VASP]
     │                              │                              │
     │  1. POST /transfer-auth      │                              │
     │ ────────────────────────────► │                              │
     │                              │ ── KYT Gate ──               │
     │                              │ ── PASS ──►                  │
     │                              │  2. Protocol Adapter         │
     │                              │ ────────────────────────────►│
     │                              │                              │
     │                              │  3. confirm/deny             │
     │                              │ ◄────────────────────────────│
     │  4. 결과 수신                 │                              │
     │ ◄──────────────────────────── │                              │
     │                              │                              │
     │  5. 블록체인 전송 (온체인)      │                              │
     │ ═══════════════════════════════════════════════════════════►│
     │                              │                              │
     │  6. POST /transfer-auth/result                              │
     │ ────────────────────────────► │                              │
     │                              │  7. TXID 전달                 │
     │                              │ ────────────────────────────►│
```

## 다음 단계

- [Transfer Authorization](/ko/api/transfer-auth) — 출금 API 상세
- [Transfer Response](/ko/api/transfer-response) — 수신 API 상세
- [암호화](/ko/guide/encryption) — NaCl Box 암호화 가이드
- [상태 머신](/ko/guide/state-machine) — 8단계 상태 전이

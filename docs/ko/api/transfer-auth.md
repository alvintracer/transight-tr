# Transfer Authorization

`transfer-auth`는 Bonanza TTR의 Travel Rule relay API입니다. 출금 요청은 반드시 수신 VASP와 active public key가 있어야 진행됩니다.

## Outgoing

```http
POST /transfer-auth
```

### Request

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "currency": "BTC",
  "amount": "0.01",
  "tradePrice": "1500000",
  "tradeCurrency": "KRW",
  "isExceedingThreshold": true,
  "address": "bc1q...",
  "network": "bitcoin",
  "originatorVaspEntityId": "bank-a",
  "beneficiaryVaspEntityId": "kakaopay",
  "payload": "ENCRYPTED_IVMS101_BASE64"
}
```

| Field | Required | 설명 |
| --- | --- | --- |
| `transferId` | yes | 중복 불가한 transfer id |
| `currency` | yes | asset symbol |
| `amount` | yes | 전송 수량 |
| `payload` | yes | 수신 VASP public key로 암호화된 IVMS101 |
| `beneficiaryVaspEntityId` | yes | 수신 VASP id |
| `originatorVaspEntityId` | no | 송신 기관 id |
| `address` | no | KYT와 metadata용 수신 주소 |
| `network` | no | chain/network 이름 |

### Processing

1. `transferId` 중복을 확인합니다.
2. `beneficiaryVaspEntityId`를 필수로 검증합니다.
3. 수신 VASP의 health와 active public key를 확인합니다.
4. KYT Gate를 수행합니다.
5. KYT block이면 PII payload relay 없이 `denied`로 저장합니다.
6. pass/warn이면 수신 VASP endpoint로 암호화 payload를 relay합니다.
7. 결과는 `verified`, `denied`, `pending` 중 하나로 저장합니다.

`pending`은 자동으로 `verified`로 바꾸지 않습니다.

### Response

```json
{
  "result": "pending",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "beneficiaryVasp": {
    "vaspEntityId": "kakaopay",
    "vaspName": "KakaoPay"
  },
  "kyt": {
    "decision": "pass",
    "riskScore": 12
  },
  "adapter": {
    "protocol": "bonanza",
    "latencyMs": 132
  }
}
```

## Incoming

```http
POST /transfer-auth/incoming
```

수신 측에서 외부 encrypted Travel Rule 메시지를 기록할 때 사용합니다. 현재 구현은 incoming transfer를 `pending`으로 저장하고 TTL queue에 넣습니다.

## Lookup

```http
GET /transfer-auth?id={transferId}
```

## Result Report

```http
POST /transfer-auth/result
```

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "txid": "0x...",
  "vout": "0"
}
```

## Finish

```http
POST /transfer-auth/finish
```

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "reasonType": "CANCELED_BY_USER",
  "reasonMsg": "Transfer canceled"
}
```

## 주요 에러

| Code | 설명 |
| --- | --- |
| `INVALID_REQUEST` | 필수 필드 누락 |
| `TRANSFER_DUPLICATE` | transfer id 중복 |
| `VASP_NOT_FOUND` | 수신 VASP 미등록 |
| `VASP_HEALTH_DOWN` | 수신 VASP down |
| `VASP_KEY_NOT_FOUND` | active encryption public key 없음 |
| `KYT_BLOCK` | KYT Gate 차단 |
| `RELAY_ERROR` | 상대 endpoint relay 실패 |

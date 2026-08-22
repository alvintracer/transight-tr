# Transfer Authorization

`transfer-auth` is the TravelSafer Travel Rule relay API. Outgoing requests require a beneficiary VASP and an active beneficiary public key.

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

| Field | Required | Description |
| --- | --- | --- |
| `transferId` | yes | Unique transfer id |
| `currency` | yes | Asset symbol |
| `amount` | yes | Transfer amount |
| `payload` | yes | IVMS101 encrypted for the beneficiary VASP |
| `beneficiaryVaspEntityId` | yes | Beneficiary VASP id |
| `originatorVaspEntityId` | no | Originator institution id |
| `address` | no | Beneficiary address for KYT and metadata |
| `network` | no | Chain/network name |

### Processing

1. Reject duplicated `transferId`.
2. Require `beneficiaryVaspEntityId`.
3. Verify beneficiary health and active public key.
4. Run KYT Gate.
5. If blocked, store `denied` without relaying PII payload.
6. If passed or warned, relay encrypted payload to the beneficiary endpoint.
7. Store the result as `verified`, `denied`, or `pending`.

`pending` is not converted to `verified`.

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

Records incoming encrypted Travel Rule messages. The current implementation stores incoming transfers as `pending` and queues them for matching.

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

## Errors

| Code | Meaning |
| --- | --- |
| `INVALID_REQUEST` | Required field missing |
| `TRANSFER_DUPLICATE` | Duplicate transfer id |
| `VASP_NOT_FOUND` | Beneficiary VASP not registered |
| `VASP_HEALTH_DOWN` | Beneficiary VASP is down |
| `VASP_KEY_NOT_FOUND` | No active encryption public key |
| `KYT_BLOCK` | KYT Gate blocked the transfer |
| `RELAY_ERROR` | Counterparty relay failed |

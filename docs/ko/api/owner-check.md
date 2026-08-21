# OwnerCheck

OwnerCheck는 동일 계정주 검증을 위한 Bonanza 확장 API입니다. 원래 CodeVASP API namespace에는 없던 기능이므로 `/owner-check`로 분리해 제공합니다.

## Purpose

이 API는 Travel Rule 본 검증을 대체하지 않습니다. 미DD 상대, 비의무 VASP, 해외 사업자, 내부 리스크 정책상 추가 확인이 필요한 송수신 전에 "이 주소의 계정주가 송신인과 동일한가"를 확인하기 위한 보강 수단입니다.

v1 기본 원칙은 다음과 같습니다.

| 항목 | 정책 |
|------|------|
| Routing | Bonanza가 수신 VASP public key와 endpoint를 조회합니다. |
| Payload | 송신 VASP 또는 금융기관 채널에서 수신 VASP public key로 암호화합니다. |
| Storage | Bonanza는 상태, routing, 결과 metadata만 저장합니다. |
| Schema | 이름, 생년월일, 주소 비교 정책은 기관별 rule로 둡니다. |
| CODE compatibility | CodeVASP namespace를 수정하지 않고 별도 extension으로 둡니다. |

## Create OwnerCheck

```http
POST /owner-check
Authorization: Bearer <BONANZA_TTR_API_KEY>
Content-Type: application/json
```

또는 path로 수신 VASP를 지정할 수 있습니다.

```http
POST /owner-check/{beneficiaryVaspEntityId}
Authorization: Bearer <BONANZA_TTR_API_KEY>
Content-Type: application/json
```

### Request Body

```json
{
  "ownerCheckId": "oc_20260821_000001",
  "originatorVaspEntityId": "kakaopay",
  "beneficiaryVaspEntityId": "global-exchange",
  "currency": "BTC",
  "network": "bitcoin",
  "address": "bc1q...",
  "tag": null,
  "payload": "BASE64_ENCRYPTED_OWNER_CHECK_PAYLOAD",
  "payloadFormat": "encrypted-json",
  "policy": {
    "name": "normalized-exact",
    "dateOfBirth": "yyyymmdd-exact"
  }
}
```

### Field Notes

| Field | Required | Description |
|-------|----------|-------------|
| `ownerCheckId` | No | Client supplied idempotency key. If omitted, Bonanza creates one. |
| `originatorVaspEntityId` | Yes | Requesting VASP or financial institution tenant. |
| `beneficiaryVaspEntityId` | Yes | VASP that can verify the account owner. Path value has priority if present. |
| `currency` | Yes | Asset symbol. |
| `network` | No | Chain or network name. |
| `address` | Yes | Deposit address to verify. |
| `tag` | No | Memo, destination tag, or output index when needed. |
| `payload` | Yes | Encrypted same-owner verification payload. |
| `payloadFormat` | No | `encrypted-json` by default. |
| `policy` | No | Requested comparison policy hint. Final policy is controlled by the beneficiary. |

## Recommended Payload

The inner payload is encrypted before Bonanza receives it.

```json
{
  "subject": {
    "name": {
      "original": "홍길동",
      "normalized": "HONG GILDONG"
    },
    "dateOfBirth": "19900101"
  },
  "account": {
    "currency": "BTC",
    "network": "bitcoin",
    "address": "bc1q...",
    "tag": null
  },
  "requestedAt": "2026-08-21T09:00:00Z"
}
```

향후 기관 합의가 끝나면 salted hash 또는 PSI 방식으로 줄일 수 있습니다. 현재 v1 문서는 암호화 payload relay를 기준으로 합니다.

## Response

```json
{
  "result": "success",
  "ownerCheckId": "oc_20260821_000001",
  "status": "pending",
  "beneficiaryVaspEntityId": "global-exchange",
  "routed": true
}
```

## Query Result

```http
GET /owner-check?id=oc_20260821_000001
Authorization: Bearer <BONANZA_TTR_API_KEY>
```

```json
{
  "ownerCheckId": "oc_20260821_000001",
  "status": "verified",
  "result": "matched",
  "reasonType": null,
  "reasonMsg": null,
  "createdAt": "2026-08-21T09:00:00Z",
  "updatedAt": "2026-08-21T09:00:02Z"
}
```

## Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Routed to beneficiary VASP or waiting for response. |
| `verified` | Same-owner check matched under beneficiary policy. |
| `denied` | Same-owner check failed or beneficiary declined. |
| `expired` | No response within configured TTL. |
| `failed` | Routing or system error. |

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_REQUEST` | 400 | Required field is missing or malformed. |
| `OWNER_CHECK_DUPLICATE` | 409 | Same `ownerCheckId` already exists. |
| `OWNER_CHECK_NOT_FOUND` | 404 | Query id not found. |
| `VASP_NOT_FOUND` | 404 | Beneficiary VASP is not registered. |
| `VASP_KEY_NOT_FOUND` | 404 | Beneficiary has no active encryption key. |
| `ROUTING_FAILED` | 502 | Beneficiary endpoint could not be reached. |

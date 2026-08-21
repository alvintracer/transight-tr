# OwnerCheck

OwnerCheck is Bonanza's extension API for Identical Account Owner Verification. It was not part of the original CodeVASP API namespace, so it is exposed separately under `/owner-check`.

## Purpose

OwnerCheck does not replace Travel Rule authorization. It is an enhanced risk mitigation tool for non-obliged counterparties, unDD counterparties, overseas VASPs, or any flow that requires an additional same-owner check before transfer.

The v1 model is:

| Item | Policy |
|------|--------|
| Routing | Bonanza resolves the beneficiary VASP public key and endpoint. |
| Payload | The originator encrypts the payload to the beneficiary VASP public key. |
| Storage | Bonanza stores status, routing, and result metadata only. |
| Schema | Name and date-of-birth matching policies are institution-specific. |
| CODE compatibility | The CodeVASP namespace stays unchanged. OwnerCheck is a separate extension. |

## Create OwnerCheck

```http
POST /owner-check
Authorization: Bearer <BONANZA_TTR_API_KEY>
Content-Type: application/json
```

You may also provide the beneficiary in the path.

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
| `ownerCheckId` | No | Client supplied idempotency key. Bonanza creates one when omitted. |
| `originatorVaspEntityId` | Yes | Requesting VASP or financial-institution tenant. |
| `beneficiaryVaspEntityId` | Yes | VASP that can verify the account owner. Path value has priority when present. |
| `currency` | Yes | Asset symbol. |
| `network` | No | Chain or network name. |
| `address` | Yes | Deposit address to verify. |
| `tag` | No | Memo, destination tag, or output index when needed. |
| `payload` | Yes | Encrypted same-owner verification payload. |
| `payloadFormat` | No | Defaults to `encrypted-json`. |
| `policy` | No | Requested comparison policy hint. The beneficiary controls the final policy. |

## Recommended Payload

The inner payload is encrypted before Bonanza receives it.

```json
{
  "subject": {
    "name": {
      "original": "HONG GILDONG",
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

Salted hash or PSI-based matching can be added later after institutional policy alignment. The v1 documentation assumes encrypted payload relay.

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
| `pending` | Routed to the beneficiary VASP or waiting for response. |
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

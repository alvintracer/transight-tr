# Transfer Response

`transfer-response` is a compatibility API for the older beneficiary response flow. After the 2026-08 redesign, new integrations should use `transfer-auth` and `owner-check`.

## Current Position

| Area | Policy |
|------|--------|
| New Travel Rule relay | `POST /transfer-auth` |
| Incoming request intake | `POST /transfer-auth/incoming` |
| Beneficiary verification result | `POST /transfer-auth/finish` or an operating webhook |
| Identical account owner check | `POST /owner-check` |
| Legacy response API | Compatibility only |

## Legacy Endpoints

Use these only when an existing counterparty already depends on this shape.

```http
POST /transfer-response/confirm
POST /transfer-response/deny
POST /transfer-response/beneficiary
GET  /transfer-response/pending
POST /transfer-response/webhook
```

## Migration Guide

| Legacy concept | New API |
|----------------|---------|
| Beneficiary verify/deny response | `POST /transfer-auth/finish` |
| Originator status lookup | `GET /transfer-auth?id={transferId}` |
| txHash reporting | `POST /transfer-auth/result` |
| Address or owner pre-check | `POST /owner-check` |

## Response Contract

The legacy response keeps the contract small for compatibility.

```json
{
  "result": "success",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "verified"
}
```

## Notes

- No new product behavior is added to this API.
- It is not used as a GTR, Sumsub, or VerifyVASP data plane.
- New FI and VASP documentation should point to `transfer-auth` and `owner-check`.

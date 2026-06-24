# API Overview

## Base URL

```
https://api.transight.io/v1
```

## Authentication

All API requests require an `Authorization` header:

```http
Authorization: Bearer <TRANSIGHT_API_KEY>
```

::: tip
For service-to-service communication and batch processing, use the service key (`<TRANSIGHT_SERVICE_KEY>`) for elevated privileges.
:::

## Endpoints

### System

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | System health check |

### VASP Registry

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/vasp-registry` | List all VASPs |
| `GET` | `/vasp-registry?id={id}` | Get VASP details |
| `POST` | `/vasp-registry` | Register a new VASP |
| `POST` | `/vasp-registry/keys` | Register public key |

### Transfer Authorization (Outgoing)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/transfer-auth` | Outgoing TR authorization (KYT + IVMS101) |
| `POST` | `/transfer-auth/incoming` | Incoming TR receipt |
| `GET` | `/transfer-auth?id={id}` | Transfer status query |
| `POST` | `/transfer-auth/result` | Report transfer result (TXID) |
| `POST` | `/transfer-auth/finish` | Cancel transfer |

### Transfer Response (Incoming)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/transfer-response/confirm` | Beneficiary confirm (MATCHED) |
| `POST` | `/transfer-response/deny` | Beneficiary deny (NOT_MATCHED) |
| `POST` | `/transfer-response/beneficiary` | Second IVMS101 exchange |
| `GET` | `/transfer-response/pending` | Pending incoming list |
| `GET` | `/transfer-response?id={id}` | Individual incoming TR detail |
| `POST` | `/transfer-response/webhook` | External webhook callback |

### KYT Block Registry (Admin Only)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/kyt-block-registry` | Register ra_code2 block target |
| `GET` | `/kyt-block-registry?vasp={id}` | List registered block targets |
| `DELETE` | `/kyt-block-registry/{id}` | Remove block target |

::: warning Admin Only
KYT Block Registry APIs require `TRANSIGHT_SERVICE_KEY`. Customer API keys cannot access these endpoints.
:::

## Common Response Format

### Success Response

```json
{
  "status": "up",
  "timestamp": "2026-06-01T13:42:49.819Z",
  "data": { ... }
}
```

### Error Response

```json
{
  "error": "TRANSFER_NOT_FOUND",
  "message": "Transfer with ID 'abc-123' not found",
  "timestamp": "2026-06-01T13:42:49.819Z"
}
```

## Request Headers (CODE VASP Compatible)

| Header | Required | Description |
|--------|----------|-------------|
| `X-Code-Req-Datetime` | ✅ | ISO8601 UTC |
| `X-Code-Req-Nonce` | ✅ | Random nonce (no duplicates within 100s) |
| `X-Code-Req-PubKey` | ✅ | Sender VASP Ed25519 public key (Base64) |
| `X-Code-Req-Remote-PubKey` | ⬜ | Receiver VASP public key (encryption APIs only) |
| `X-Code-Req-Signature` | ✅ | Ed25519 signature (Base64) |
| `X-Request-Origin` | ✅ | `solution:entityId` (e.g., `transight:my-vasp`) |

### Signature Generation

```
signature = Ed25519.sign(
  concat(datetime_bytes, body_bytes, nonce_4bytes_bigendian),
  signing_key
)
```

## KYT Operating Modes

KYT integration can be configured per VASP:

| Mode | `kyt_mode` | KYT Check | TR Block |
|------|------------|-----------|----------|
| **TR Only** | `none` | ❌ | ❌ |
| **KYT Only** | `kyt_only` | ✅ | ❌ (separate) |
| **Atomic** | `atomic` | ✅ | Configurable |

In `atomic` mode with `kyt_auto_block=true`, matching `ra_code2` entries in the Block Registry automatically block the transfer.
With `kyt_auto_block=false`, KYT results are returned but TR proceeds normally.

→ See [Atomic KYT Gate](/en/guide/kyt-gate) for details.

## 8-Step TR Flow

```
Step 1: Originator VASP → Hub: Outgoing request + KYT config check
Step 2: Hub: KYT Gate (skip/return/block based on settings)
        (BLOCK → Stop here — PII not transmitted)
Step 3: Originator VASP → Hub: 1st IVMS101 (NaCl Box encrypted)
Step 4: Hub → Beneficiary VASP: Channel bridging (Protocol Adapter)
Step 5: Beneficiary VASP → Hub → Originator VASP: Confirm recipient
Step 6: Hub → Beneficiary VASP: 2nd IVMS101 (both parties' info)
Step 7: Originator VASP → Blockchain: On-chain transfer (Hub bypassed)
Step 8: Originator VASP → Hub: TXID report → TTL Queue matching
```

# API Overview

## Base URL

```
https://<your-project>.supabase.co/functions/v1
```

## Authentication

All API requests require an `Authorization` header:

```http
Authorization: Bearer <SUPABASE_ANON_KEY>
```

::: tip
For service-to-service communication, use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS policies.
:::

## Endpoints

### Available APIs

| Method | Path | Description | Status |
|--------|------|-------------|--------|
| `GET` | `/health` | System health check | ✅ Live |
| `GET` | `/vasp-registry` | List all VASPs | ✅ Live |
| `GET` | `/vasp-registry?id={id}` | Get VASP details | ✅ Live |
| `POST` | `/vasp-registry` | Register a new VASP | ✅ Live |
| `POST` | `/transfer-auth` | Request transfer authorization | 🔧 Skeleton |
| `GET` | `/transfer-auth?id={id}` | Check transfer status | 🔧 Skeleton |

### Planned APIs

| Method | Path | Description | Phase |
|--------|------|-------------|-------|
| `POST` | `/transfer-result` | Report transfer result (TXID) | Phase 3 |
| `POST` | `/transfer-finish` | Cancel/complete transfer | Phase 3 |
| `POST` | `/address-search` | Search VASP by wallet address | Phase 2 |
| `POST` | `/address-verify` | Verify beneficiary | Phase 2 |

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

The following headers are required for TR message exchange:

| Header | Required | Description |
|--------|----------|-------------|
| `X-Code-Req-Datetime` | ✅ | ISO8601 UTC (e.g., `2026-06-01T15:10Z`) |
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

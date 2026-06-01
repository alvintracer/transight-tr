# Authentication

## Ed25519 Signature-Based Authentication

TranSight TR uses **Ed25519 digital signatures** for all TR message exchanges.

## Signature Generation Flow

```
1. datetime = ISO8601 UTC current time
2. nonce = random integer (no duplicates within 100 seconds)
3. body = request body (JSON string)
4. data = concat(datetime_bytes, body_bytes, nonce_4bytes_bigendian)
5. signature = Ed25519.sign(data, signing_key)
6. Include in headers
```

## Required Headers

| Header | Example |
|--------|---------|
| `X-Code-Req-Datetime` | `2026-06-01T15:10:00.000Z` |
| `X-Code-Req-Nonce` | `1234567890` |
| `X-Code-Req-PubKey` | `Base64(Ed25519 public key)` |
| `X-Code-Req-Signature` | `Base64(signature)` |
| `X-Request-Origin` | `transight:my-vasp-id` |

## TypeScript Implementation

```typescript
import { createRequestHeaders } from '@transight/utils/signature';

const headers = createRequestHeaders({
  privateKey: process.env.TRANSIGHT_PRIVATE_KEY!,
  vaspEntityId: 'my-vasp-id',
  body: JSON.stringify(requestBody),
  allianceName: 'transight',
});
```

## Nonce Rules

- Converted to 4-byte Big-Endian unsigned integer
- Same nonce cannot be reused within 100 seconds
- Server validates and may reject duplicate nonces

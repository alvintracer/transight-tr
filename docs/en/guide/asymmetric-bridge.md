# Asymmetric Bridge

## Overview

TranSight Hub's asymmetric bridge uses the **Protocol Adapter pattern** to unify communication with different TR solutions and channels.

The appropriate adapter is automatically selected based on the beneficiary VASP's `alliance_name`.

## Architecture

```
             Transfer Auth Request
                    │
                    ▼
         ┌──────────────────┐
         │  Protocol Router │ ← Routes by alliance_name
         └──┬──────┬──────┬─┘
            │      │      │
    ┌───────▼──┐ ┌─▼────┐ ┌▼──────────┐
    │  CODE    │ │ TSI  │ │  Direct   │
    │ Adapter  │ │(Int.)│ │ Adapter   │
    └────┬─────┘ └──┬───┘ └─────┬─────┘
         │          │           │
    CODE API    Supabase   HTTPS/mTLS
    (External)  (DB Direct) (Individual)
```

## Protocol Adapters

### CODE VASP Adapter (`code`)

| Property | Details |
|----------|---------|
| Target | CODE Alliance VASPs |
| Endpoint | `https://trapi.codevasp.com/v1/code/transfer/{vaspId}` |
| Auth | Ed25519 signature headers (5 headers) |
| Encryption | NaCl Box (XSalsa20-Poly1305) |
| Features | Full CODE protocol compatibility |

### TranSight Internal Adapter (`transight`)

| Property | Details |
|----------|---------|
| Target | VASPs within TranSight network |
| Method | Direct Supabase DB query |
| Latency | ~0ms |
| Features | No external API calls |

### VerifyVASP Adapter (`verifyvasp`)

::: warning 🚧 Coming Soon
VerifyVASP uses a gRPC-based protocol. Requires a separate gRPC client.
:::

### Direct Adapter (`direct`)

| Property | Details |
|----------|---------|
| Target | Individual VASPs (global, non-standard) |
| Protocol | CODE-compatible format over HTTPS |
| Endpoint | Each VASP's `endpoint_url` |
| Security | HTTPS / mTLS / VPN / Leased Line |

**Channel Security Levels**:

| Channel | Target | Security |
|---------|--------|----------|
| `HTTPS` | Exchanges | TLS 1.3 + AES-256 |
| `mTLS` | Digital Banks | Mutual Certificate |
| `VPN` | Traditional Banks | IPSec Tunnel |
| `LEASED_LINE` | Legacy Banks | Physical Isolation |

## API Response Example

Transfer Auth responses include an `adapter` field:

```json
{
  "result": "verified",
  "transferId": "abc-123",
  "kyt": { "decision": "PASS", "riskScore": 0 },
  "adapter": {
    "protocol": "code",
    "latencyMs": 150
  }
}
```

## Adapter Selection Logic

```typescript
const adapters = {
  'code':       CodeVaspAdapter,      // CODE API call
  'verifyvasp': VerifyVaspAdapter,    // gRPC (planned)
  'transight':  TransightInternal,    // DB direct
  'direct':     DirectAdapter,        // HTTPS individual
};

// Unknown alliance → Direct Adapter fallback
```

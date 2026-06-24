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
     CODE API     Internal DB   HTTPS/mTLS
     (External)  (DB Direct)   (Individual)
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
| Method | Direct Internal DB query |
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

Financial institutions can selectively utilize communication channel options optimized for their internal security standards and regulatory compliance policies.

| Channel | Target Institution | Security & Key Features |
|---------|--------------------|-------------------------|
| `HTTPS` | Crypto Exchanges | TLS 1.3 + AES-256 standardized encrypted communication |
| `mTLS` | Financial Institutions | Mutual certificate verification with OAuth 2.0 authorization |
| `VPN` | Financial Institutions | Private virtual network configuration based on IPSec tunnel |
| `LEASED_LINE` | Financial Institutions | Physical network segregation with direct private leased line integration |

* **Customized Security Channels**: Establishes optimal channels—`mTLS`, `IPSec VPN`, or `Leased Line`—aligned with each financial institution's network infrastructure and internal compliance policies.
* **Leased Line Option**: For financial institutions that have already established dedicated private lines, TranSight TR fully supports integration using their existing private leased line infrastructure, maintaining strict physical isolation.

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

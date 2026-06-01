# Introduction

## What is TranSight TR?

**TranSight TR** is an **asymmetric bridge-based Travel Rule solution** designed for Virtual Asset Service Providers (VASPs) and financial institutions.

While existing TR solutions only allow communication between VASPs using the same protocol, TranSight TR connects institutions with different security requirements and protocols into a single network through its **asymmetric bridge architecture**.

## Why TranSight TR?

### 1. Asymmetric Bridge

| Target | Channel | Security Level |
|--------|---------|---------------|
| Crypto Exchanges | HTTPS + OAuth 2.0 | TLS 1.3 + AES-256 |
| Digital Banks | mTLS + OAuth 2.0 | Mutual Certificate Verification |
| Traditional Banks | IPSec VPN | Encrypted Tunnel |
| Legacy Banks | Leased Line | Physical Isolation |

### 2. Atomic KYT Gate

```
KYT Check → BLOCK? → PII transmission blocked (Privacy protection)
           → PASS?  → Proceed with TR message delivery
```

Personal information (PII) is **never transmitted** before the KYT (Know Your Transaction) result is confirmed.

### 3. Cross-Solution Compatibility

TranSight TR interoperates at the protocol level with:

- **CODE VASP** — NaCl Box encryption + Ed25519 signatures
- **VerifyVASP** — OpenVASP-based
- **International VASPs** — Direct integration (Bybit, Bitget, etc.)

## Core Technology Stack

| Component | Technology |
|-----------|-----------|
| Encryption | NaCl Box (X25519 + XSalsa20-Poly1305) |
| Signatures | Ed25519 |
| Message Format | IVMS101 (FATF Standard) |
| State Management | 8-stage State Machine |
| Backend | Supabase (PostgreSQL + Edge Functions) |
| Runtime | TypeScript (Deno / Node.js) |

## Next Steps

- [Architecture](./architecture.md) — Understand the system structure
- [Quick Start](./quickstart.md) — Send your first TR in 5 minutes
- [API Reference](/en/api/overview) — API endpoint reference

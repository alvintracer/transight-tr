# Introduction

## What is TranSight TR?

**TranSight TR** is an **asymmetric bridge-based Travel Rule solution** designed for Virtual Asset Service Providers (VASPs) and financial institutions.

While existing TR solutions only allow communication between VASPs using the same protocol, TranSight TR connects institutions with different security requirements and protocols into a single network through its **asymmetric bridge architecture**.

## Why TranSight TR?

### 1. Asymmetric Bridge

Security compliance requirements vary across different financial institutions. Rather than forcing a single rigid protocol, TranSight TR provides tailored connection options based on the preferred security channel of each financial institution.

| Target | Security Channel Options | Security Level & Features |
|--------|--------------------------|---------------------------|
| Crypto Exchanges | HTTPS + OAuth 2.0 | TLS 1.3 + Standardized AES-256 encrypted communication |
| Financial Institutions | mTLS / IPSec VPN / Leased Line | Mutual certificate verification, encrypted tunnels, and physical isolation |

* **Customized Security Channels**: Seamlessly establish and integrate optimal security channel options—such as `mTLS + OAuth 2.0`, `IPSec VPN`, or `Leased Line`—aligned with the internal security standards of each financial institution.
* **Leased Line Integration**: For financial institutions that have already established dedicated private lines, TranSight TR fully supports integration using their existing private leased line infrastructure.

### 2. Atomic KYT Gate

```
KYT Check → BLOCK? → PII transmission blocked (Privacy protection)
           → PASS?  → Proceed with TR message delivery
```

Personal information (PII) is **never transmitted** before the KYT (Know Your Transaction) result is confirmed.

### 3. Cross-Solution Compatibility

TranSight TR guarantees full protocol-level interoperability with the following major domestic and global Travel Rule alliances:

- **CODE VASP** — Domestic exchange interoperability via NaCl Box encryption and Ed25519 signatures
- **Sumsub Hub** — Global compliance and TRUST (Travel Rule Universal Solution Technology) alliance compatibility via HMAC-SHA256 signatures
- **VerifyVASP** — OpenVASP protocol-based integration support
- **International VASPs** — Direct integration and custom protocol translation (Bybit, Bitget, etc.)

## Core Technology Stack

| Component | Technology |
|-----------|-----------|
| Encryption | NaCl Box (X25519 + XSalsa20-Poly1305) |
| Signatures | Ed25519 |
| Message Format | IVMS101 (FATF Standard) |
| State Management | 8-stage State Machine |
| Backend | Cloud Native Serverless (PostgreSQL + API Hub) |
| Runtime | TypeScript (Deno / Node.js) |

## Next Steps

- [Architecture](./architecture.md) — Understand the system structure
- [Quick Start](./quickstart.md) — Send your first TR in 5 minutes
- [API Reference](/en/api/overview) — API endpoint reference

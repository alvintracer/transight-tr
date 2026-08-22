# Introduction

Bonanza TTR is a Travel Rule gateway for financial institutions and VASPs that need to exchange digital-asset transfer compliance data safely.

As of the 2026-08 redesign, Bonanza TTR is no longer positioned as a hub that directly adapts every external Travel Rule network. The baseline is a Bonanza-operated public-key directory and encrypted relay with domestic integration channels for financial institutions.

The implementation still considers compatibility with existing VASP public-key integration models, but the product should be presented around financial-institution onboarding, encrypted relay, OwnerCheck, and KYT Gate.

## Core Roles

| Role | Description |
| --- | --- |
| Public Key Directory | Manages connected VASP Ed25519 public keys, endpoints, channels, and capabilities. |
| Travel Rule Relay | Relays IVMS101 payloads encrypted by the originator for the beneficiary VASP. |
| Financial Institution Gateway | Supports IDC ingress, leased lines, mTLS, VPN/IPsec, and channel encryption. |
| OwnerCheck | Provides Identical Account Owner Verification as a separate API. |
| KYT Gate | Blocks risky transfers before Travel Rule payload relay. |
| Audit | Records transfer, owner check, key rotation, and routing metadata. |

## Non-Goals

- Do not auto-verify transfers without a beneficiary VASP.
- Do not proceed without an active beneficiary public key.
- Do not convert `pending` to `verified`.
- Do not operate GTR, Sumsub, or VerifyVASP adapters as the core data plane.
- Do not present OwnerCheck as the Travel Rule authorization itself.

## Basic Flow

```text
1. Originator queries beneficiary VASP public key.
2. Originator encrypts IVMS101 payload for the beneficiary VASP.
3. Originator calls POST /transfer-auth.
4. Bonanza TTR runs KYT Gate.
5. If blocked, relay stops and the result is denied.
6. If passed or warned, Bonanza relays the encrypted payload to the beneficiary endpoint.
7. Bonanza stores and returns verified / denied / pending.
```

OwnerCheck is separate from Travel Rule authorization. It is an enhanced risk mitigation tool for same-owner checks, non-obliged counterparties, or higher-risk flows.

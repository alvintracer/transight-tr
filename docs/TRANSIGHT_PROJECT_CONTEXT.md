# TranSight TR Project Context

Last updated: 2026-08-21

## 1. Product Direction

TranSight TR is being redesigned as Bonanza's Travel Rule Gateway.

The core product is no longer a multi-adapter hub that tries to connect every Travel Rule network at once. The baseline is a CodeVASP-compatible network operated by Bonanza:

- Bonanza stores and serves VASP public keys.
- Originating institutions encrypt Travel Rule payloads with the beneficiary VASP public key.
- Bonanza relays encrypted payloads and manages transaction metadata, status, audit, and operational routing.
- Banks and regulated financial institutions may connect through Bonanza's existing VAN/electronic financial auxiliary infrastructure, including IDC-hosted servers, dedicated connectivity, mTLS, VPN/IPsec, and section encryption.
- Non-financial VASPs and overseas exchanges can use cloud APIs or a CodeVASP-compatible install assistant/SDK.

## 2. Confirmed Architecture Decisions

| Area | Decision |
| --- | --- |
| Core protocol | CodeVASP-compatible relay |
| Default alliance namespace | `bonanza` |
| Public key registry | Bonanza-managed VASP registry |
| Canonical public key | Base64 Ed25519 verify key |
| Payload encryption | X25519/Curve25519 derived from Ed25519 key, using CodeVASP-compatible NaCl box semantics |
| Travel Rule payload | IVMS101 encrypted for the beneficiary |
| Owner verification | New Bonanza `OwnerCheck` extension |
| Legacy address verification | Deprecated in favor of OwnerCheck |
| GTR/Sumsub/VV adapters | Removed from the core path; future optional integrations only |

## 3. Core Runtime

```text
Financial Institution / VASP
        |
        | HTTPS / mTLS / VPN / leased line
        v
Bonanza TTR Gateway
  - Public Key Registry
  - CodeVASP-compatible Transfer Relay
  - OwnerCheck Relay
  - KYT Atomic Gate
  - Transfer Status Machine
  - TTL Queue and Audit Log
        |
        v
Beneficiary VASP / Institution Endpoint
```

## 4. Primary Edge Functions

| Function | Role |
| --- | --- |
| `health` | Operational health check |
| `vasp-registry` | VASP registration, lookup, active public-key discovery, key rotation |
| `transfer-auth` | Outgoing/incoming Travel Rule relay with KYT pre-gate |
| `owner-check` | Identical Account Owner Verification relay |
| `transfer-response` | Legacy response handling retained for compatibility |

## 5. Data Model

Main tables:

- `vasps`: VASP identity, endpoint, channel type, health, metadata
- `public_keys`: Ed25519 public keys, key purpose, key id, version, expiry, metadata
- `transfers`: Travel Rule transfer metadata and encrypted payload reference
- `owner_checks`: OwnerCheck request metadata, encrypted/hash payload, result
- `ttl_queue`: incoming transfer matching queue
- `audit_log`: regulatory and operational audit events

## 6. Implementation Notes

- `beneficiaryVaspEntityId` is mandatory for outgoing `transfer-auth`.
- The beneficiary VASP must have an active non-expired public key with `key_purpose` of `both` or `encryption`.
- Missing beneficiary VASP or public key must not auto-verify.
- `pending` must remain `pending`; it must not be silently converted to `verified`.
- `OwnerCheck` stays outside `/v1/code/*` to avoid breaking CodeVASP compatibility.
- CodeVASP-compatible clients should treat `public_keys.algorithm = Ed25519` plus `metadata.encryptionDerivation = ed25519_to_x25519` as the required encryption interpretation.

## 7. Current Source Of Truth

- Core redesign plan: `AI-Sessions/wiki/design/2026-08-21-ttr-codevasp-core-redesign-plan.md`
- API specification: `docs/ttr-api-specification.md`
- CodeVASP source reference: `https://github.com/codevasp-lab/codevasp-skills`

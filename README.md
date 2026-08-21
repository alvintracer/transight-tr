# Bonanza TTR

Bonanza TTR is a Travel Rule Gateway redesigned around the CodeVASP-style public key and encrypted payload relay model.

## Core Direction

- `bonanza` is the default alliance route.
- Bonanza operates the VASP public key directory and encrypted payload relay.
- Registry keys are Base64 Ed25519 public keys.
- Payload encryption derives X25519/Curve25519 keys from Ed25519 keys for CodeVASP compatibility.
- Financial institutions can connect through Bonanza IDC channels such as dedicated lines, VPN/IPsec, mTLS, and VAN-style operating infrastructure.
- Non-financial VASPs and overseas exchanges can connect through cloud API, SDK, or onboarding assistant.
- GTR, Sumsub, and VerifyVASP adapters are disabled in the core data plane and treated as future optional rails.
- Same-owner verification is provided as the Bonanza extension `OwnerCheck`.

## Main Components

```text
Bank / VASP / Fintech
        |
        v
Bonanza TTR Gateway
  - health
  - vasp-registry
  - transfer-auth
  - owner-check
        |
        +-- Public Key Directory
        +-- CodeVASP-compatible Relay
        +-- OwnerCheck Relay
        +-- Atomic KYT Gate
        +-- Transfer Status / TTL Queue / Audit Log
```

## Primary Edge Functions

| Function | Purpose |
| --- | --- |
| `health` | Service health check |
| `vasp-registry` | VASP registration, lookup, public-key search, key rotation |
| `transfer-auth` | Outgoing and incoming Travel Rule authorization relay |
| `owner-check` | Identical Account Owner Verification extension |
| `transfer-response` | Legacy response handling kept for compatibility |

## API Highlights

- `GET /vasp-registry/pubkey/{vaspEntityId}` returns active Ed25519 public keys plus `encryptionDerivation: ed25519_to_x25519`.
- `POST /transfer-auth` requires `beneficiaryVaspEntityId` and an active beneficiary public key.
- `POST /owner-check` or `POST /owner-check/{beneficiaryVaspEntityId}` performs same-owner verification relay.
- `POST /vasp-registry/address-verify` is deprecated and returns `ADDRESS_VERIFY_REPLACED`.

## Local Setup

```bash
npm install
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase functions deploy health
npx supabase functions deploy vasp-registry
npx supabase functions deploy transfer-auth
npx supabase functions deploy owner-check
```

## Documentation

```bash
npm run docs:dev
npm run docs:build
```

Key documents:

- `docs/TRANSIGHT_PROJECT_CONTEXT.md`
- `docs/ttr-api-specification.md`
- `AI-Sessions/wiki/design/2026-08-21-ttr-codevasp-core-redesign-plan.md`

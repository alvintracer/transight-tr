# TranSight TR

Bonanza의 Travel Rule Gateway입니다. 2026-08 redesign 이후 TTR은 기존 CodeVASP 구조를 핵심 토대로 삼고, Bonanza가 VASP 공개키 등록/조회와 암호화 payload relay를 담당하는 구조로 정리합니다.

## Core Direction

- `bonanza` 네트워크가 기본값입니다.
- CodeVASP 호환 Travel Rule API를 기본 data plane으로 사용합니다.
- Registry에 저장되는 canonical key는 Base64 Ed25519 public key입니다.
- IVMS101 payload 암호화는 CodeVASP 방식에 맞춰 Ed25519 key에서 X25519/Curve25519 key를 derive해 수행합니다.
- 금융기관은 Bonanza의 VAN/전자금융보조업자 인프라, 전용성 회선, 구간 암호화, IDC 서버를 통해 연동할 수 있습니다.
- 비금융 VASP와 해외 사업자는 cloud API 또는 CodeVASP-compatible SDK/assistant로 연동합니다.
- 기존 GTR, Sumsub, VerifyVASP adapter는 core data plane에서 제외하고 별도 후속 과제로 둡니다.
- 동일 계정주 확인은 새 Bonanza extension인 `OwnerCheck`로 제공합니다.

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
        +-- Public Key Registry
        +-- CodeVASP-compatible Relay
        +-- OwnerCheck Relay
        +-- Atomic KYT Gate
        +-- Transfer Status / TTL Queue / Audit Log
```

## Primary Edge Functions

| Function | Purpose |
| --- | --- |
| `health` | service health check |
| `vasp-registry` | VASP registration, lookup, public-key search, key rotation |
| `transfer-auth` | outgoing/incoming Travel Rule authorization relay |
| `owner-check` | Identical Account Owner Verification extension |
| `transfer-response` | legacy response handling kept for compatibility |

## API Highlights

- `GET /vasp-registry/pubkey/{vaspEntityId}` returns active Ed25519 public keys plus `encryptionDerivation: ed25519_to_x25519`.
- `POST /transfer-auth` requires `beneficiaryVaspEntityId` and an active beneficiary public key. It no longer auto-verifies unspecified counterparties.
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

## Key Docs

- `docs/TRANSIGHT_PROJECT_CONTEXT.md`
- `docs/ttr-api-specification.md`
- `AI-Sessions/wiki/design/2026-08-21-ttr-codevasp-core-redesign-plan.md`

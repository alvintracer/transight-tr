# API Overview

Source of truth: [`docs/ttr-api-specification.md`](../../ttr-api-specification.md)

## Base URL

```text
https://api.transight.io/v1
```

## Authentication

Service-to-service requests should use the configured service credential plus CodeVASP-compatible request signing where applicable.

```http
Authorization: Bearer <BONANZA_TTR_API_KEY>
```

## Endpoints

### System

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | System health check |

### VASP Registry

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/vasp-registry` | List VASPs |
| `GET` | `/vasp-registry?id={vaspEntityId}` | Get VASP details with keys |
| `GET` | `/vasp-registry/pubkey/{vaspEntityId}` | Get active Ed25519 public keys |
| `POST` | `/vasp-registry` | Register VASP and initial key |
| `PUT` | `/vasp-registry` | Update VASP metadata and endpoint |
| `DELETE` | `/vasp-registry?id={vaspEntityId}` | Delete VASP |
| `POST` | `/vasp-registry/rotate-key` | Rotate public key |

### Transfer Authorization

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/transfer-auth` | Outgoing Travel Rule relay |
| `POST` | `/transfer-auth/incoming` | Incoming encrypted Travel Rule receipt |
| `GET` | `/transfer-auth?id={transferId}` | Transfer lookup |
| `POST` | `/transfer-auth/result` | Report TXID |
| `POST` | `/transfer-auth/finish` | Cancel transfer |

### OwnerCheck

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/owner-check` | Identical Account Owner Verification relay |
| `POST` | `/owner-check/{beneficiaryVaspEntityId}` | OwnerCheck relay with path target |
| `GET` | `/owner-check?id={ownerCheckId}` | OwnerCheck lookup |

## Core Rules

- Registry keys are Base64 Ed25519 verify keys.
- Encryption uses X25519/Curve25519 derived from the Ed25519 key.
- `POST /transfer-auth` requires `beneficiaryVaspEntityId` and an active beneficiary public key.
- `pending` remains `pending`; it is not auto-converted to `verified`.
- Legacy `POST /vasp-registry/address-verify` is replaced by OwnerCheck.
- GTR, Sumsub, and VerifyVASP adapters are disabled in the core data plane.

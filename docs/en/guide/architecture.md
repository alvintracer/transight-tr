# Architecture

Bonanza TTR consists of a public-key directory, encrypted relay, financial-institution ingress, KYT Gate, and audit storage.

```text
Financial Institution / VASP
        |
        | HTTPS / mTLS / VPN / leased line
        v
Bonanza TTR Gateway
  - VASP Registry
  - Public Key Directory
  - Transfer Relay
  - OwnerCheck Relay
  - KYT Atomic Gate
  - Status / Audit / TTL Queue
        |
        v
Beneficiary VASP Endpoint
```

## Components

| Component | Role |
| --- | --- |
| `vasp-registry` | VASP registration, endpoint management, public-key search, key rotation |
| `transfer-auth` | Outgoing and incoming Travel Rule relay |
| `owner-check` | Identical Account Owner Verification relay |
| `protocol-adapter` | Bonanza/CodeVASP-compatible outbound relay |
| `kyt-gate` | KYT block decision before payload relay |
| PostgreSQL | VASP, public key, transfer, owner check, and audit metadata |

## Public Key Model

The canonical registry key is a Base64 Ed25519 verify key.

```text
public_keys.algorithm = Ed25519
public_keys.key_purpose = both | signing | encryption
metadata.encryptionDerivation = ed25519_to_x25519
metadata.encryptionSuite = X25519-XSalsa20-Poly1305
```

Encryption clients derive an X25519/Curve25519 public key from the Ed25519 public key and encrypt the IVMS101 payload for the beneficiary.

## Boundary

Bonanza TTR operates routing metadata and audit data. Plaintext IVMS101 PII should be encrypted by the originator for the beneficiary VASP before relay.

OwnerCheck follows the same boundary. v1 uses encrypted payload relay; salted hash or PSI can be added later as a separate option.

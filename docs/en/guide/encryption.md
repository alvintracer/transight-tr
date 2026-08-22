# Encryption

TravelSafer follows the CodeVASP cryptographic model.

## Key Interpretation

The registry key is a Base64 Ed25519 verify key.

```text
signature verification = Ed25519 public key
payload encryption = Ed25519 public key -> X25519 public key derivation
payload decryption = Ed25519 private key -> X25519 private key derivation
```

## Payload Encryption

```text
sender Ed25519 private key -> sender X25519 private key
receiver Ed25519 public key -> receiver X25519 public key
IVMS101 JSON -> XSalsa20-Poly1305 / NaCl box
```

The encrypted output is Base64-encoded and passed as the `payload` field to `transfer-auth` or `owner-check`.

## TravelSafer Boundary

TravelSafer operates:

- transfer id
- VASP entity id
- asset, amount, address metadata
- routing endpoint
- KYT result
- relay result
- audit metadata

Plaintext PII must stay inside payloads encrypted for the beneficiary VASP.

## OwnerCheck Payload

OwnerCheck v1 uses encrypted payload relay by default. The internal payload schema may vary by institution, but the recommended minimum is:

```json
{
  "name": "Gildong Hong",
  "dateOfBirth": "1990-01-01",
  "address": "r...",
  "asset": "XRP",
  "network": "xrp"
}
```

Salted hash or PSI-based comparison can be added later as v2 options.

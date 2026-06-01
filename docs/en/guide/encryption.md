# Encryption

::: warning 🚧 Under Construction
Will be updated in detail when Phase 3 is implemented.
:::

## NaCl Box

TranSight TR uses **NaCl Box** for IVMS101 payload encryption.

| Component | Algorithm |
|-----------|-----------|
| Key Exchange | X25519 (Ed25519 → Curve25519 conversion) |
| Encryption | XSalsa20-Poly1305 |
| Signatures | Ed25519 |

## Encryption Flow

```
1. Sender VASP: Ed25519 signing key → Curve25519 private key
2. Receiver VASP: Ed25519 verify key → Curve25519 public key
3. NaCl Box encrypt: nonce(24B) + ciphertext
4. Base64 encode → include in payload field
```

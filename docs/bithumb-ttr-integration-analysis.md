# Legacy Bithumb TTR Integration Analysis

This document is archived.

The earlier analysis assumed multi-rail adapter routing. For current Bithumb or CodeVASP-compatible VASP onboarding, use the Bonanza public-key relay model:

1. Register VASP metadata and endpoint.
2. Register active Ed25519 public key.
3. Encrypt IVMS101 payload for the beneficiary public key.
4. Relay through `transfer-auth`.
5. Use `owner-check` only for identical account-owner verification.

Current source of truth:

- [VASP Registry](/en/api/vasp-registry)
- [Transfer Authorization](/en/api/transfer-auth)
- [OwnerCheck](/en/api/owner-check)

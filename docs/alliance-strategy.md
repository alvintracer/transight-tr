# Legacy Alliance Strategy

This document is archived.

The previous alliance strategy assumed a multi-provider adapter hub. That model is no longer the product baseline.

Current source of truth:

- [TravelSafer Project Context](./TRANSIGHT_PROJECT_CONTEXT.md)
- [TravelSafer API Specification](./ttr-api-specification.md)
- [Korean internal strategy](/ko/internal/strategy)

## Current Direction

TravelSafer is a CodeVASP-compatible Travel Rule Solution built around:

1. TravelSafer Public Key Directory
2. encrypted Travel Rule payload relay
3. financial-institution IDC channels
4. OwnerCheck
5. Atomic KYT Gate

External provider adapters are future optional rails, not the core data plane.

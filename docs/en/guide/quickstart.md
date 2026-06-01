# Quick Start

::: warning 🚧 Under Construction
This page will be updated after Phase 3 (Transfer Authorization) is complete.
:::

## Prerequisites

1. Register as a VASP on TranSight Hub
2. Generate Ed25519 key pair
3. Obtain API credentials

## Send Your First TR in 5 Minutes

```bash
# 1. Register VASP
curl -X POST .../vasp-registry -d '{...}'

# 2. Discover beneficiary VASP
curl .../vasp-registry

# 3. Request Transfer Authorization
curl -X POST .../transfer-auth -d '{...}'

# 4. Check result
curl .../transfer-auth?id={transferId}
```

See [API Overview](/en/api/overview) for detailed documentation.

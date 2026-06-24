# Quick Start

Send your first Travel Rule message in 5 minutes.

## Prerequisites

1. Register as a VASP on TranSight Hub
2. Generate Ed25519 key pair (for NaCl Box encryption)
3. Obtain API credentials

## Step 1: Register VASP

```bash
curl -X POST https://api.transight.io/v1/vasp-registry \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vaspEntityId": "my-vasp",
    "vaspName": "My Exchange",
    "allianceName": "transight",
    "endpointUrl": "https://my-exchange.com/tr/callback",
    "channelType": "HTTPS",
    "features": ["KYT", "TR"]
  }'
```

## Step 2: Register Ed25519 Public Key

```bash
curl -X POST https://api.transight.io/v1/vasp-registry/keys \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vaspEntityId": "my-vasp",
    "publicKey": "Base64EncodedEd25519PublicKey",
    "algorithm": "Ed25519"
  }'
```

## Step 3: Discover Beneficiary VASP

```bash
curl "https://api.transight.io/v1/vasp-registry" \
  -H "Authorization: Bearer $API_KEY"
```

## Step 4: Request Outgoing TR Authorization

```bash
curl -X POST https://api.transight.io/v1/transfer-auth \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "transferId": "550e8400-e29b-41d4-a716-446655440000",
    "currency": "BTC",
    "amount": "0.5",
    "tradePrice": "50000000",
    "tradeCurrency": "KRW",
    "isExceedingThreshold": true,
    "payload": "NaClBoxEncryptedIVMS101Base64",
    "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "beneficiaryVaspEntityId": "bithumb-vasp",
    "originatorVaspEntityId": "my-vasp"
  }'
```

::: tip Atomic KYT Gate
If your VASP is configured with `kyt_mode=atomic`, this request automatically runs KYT verification. If `kyt_auto_block=true` and a registered `ra_code2` matches, the transfer is denied and PII is never transmitted.
:::

## Step 5: Check Transfer Status

```bash
curl "https://api.transight.io/v1/transfer-auth?id=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $API_KEY"
```

## Step 6: Report TXID (After Blockchain Transfer)

```bash
curl -X POST https://api.transight.io/v1/transfer-auth/result \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "transferId": "550e8400-e29b-41d4-a716-446655440000",
    "txid": "0xabc123...",
    "vout": "0"
  }'
```

## Full Flow Diagram

```
[Originator VASP]              [TranSight Hub]            [Beneficiary VASP]
     │                              │                              │
     │  1. POST /transfer-auth      │                              │
     │ ────────────────────────────► │                              │
     │                              │ ── KYT Gate ──               │
     │                              │ ── PASS ──►                  │
     │                              │  2. Protocol Adapter         │
     │                              │ ────────────────────────────►│
     │                              │                              │
     │                              │  3. confirm/deny             │
     │                              │ ◄────────────────────────────│
     │  4. Result received          │                              │
     │ ◄──────────────────────────── │                              │
     │                              │                              │
     │  5. Blockchain transfer      │                              │
     │ ═══════════════════════════════════════════════════════════►│
     │                              │                              │
     │  6. POST /transfer-auth/result                              │
     │ ────────────────────────────► │                              │
     │                              │  7. TXID forwarded           │
     │                              │ ────────────────────────────►│
```

## Next Steps

- [Transfer Authorization](/en/api/transfer-auth) — Outgoing API details
- [Transfer Response](/en/api/transfer-response) — Incoming API details
- [Encryption](/en/guide/encryption) — NaCl Box encryption guide
- [Atomic KYT Gate](/en/guide/kyt-gate) — KYT integration and ra_code2 registry

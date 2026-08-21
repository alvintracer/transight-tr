# Quick Start

This example shows the core Bonanza TTR flow.

## 1. Register a VASP

```bash
curl -X POST https://api.transight.io/v1/vasp-registry \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vasp_entity_id": "kakaopay",
    "vasp_name": "KakaoPay",
    "country_of_registration": "KR",
    "alliance_name": "bonanza",
    "endpoint_url": "https://partner.example.com/ttr",
    "channel_type": "mTLS",
    "public_key": "BASE64_ED25519_VERIFY_KEY",
    "key_purpose": "both"
  }'
```

## 2. Query Beneficiary Public Key

```bash
curl "https://api.transight.io/v1/vasp-registry/pubkey/kakaopay" \
  -H "Authorization: Bearer $API_KEY"
```

The `pubkey` field is a Base64 Ed25519 verify key. Encryption clients derive an X25519 key from it.

## 3. Encrypt IVMS101 Payload

```text
Ed25519 public key -> X25519 public key
IVMS101 JSON -> NaCl box -> ENCRYPTED_IVMS101_BASE64
```

## 4. Call Transfer Authorization

```bash
curl -X POST https://api.transight.io/v1/transfer-auth \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "transferId": "550e8400-e29b-41d4-a716-446655440000",
    "currency": "BTC",
    "amount": "0.01",
    "address": "bc1q...",
    "network": "bitcoin",
    "originatorVaspEntityId": "bank-a",
    "beneficiaryVaspEntityId": "kakaopay",
    "payload": "ENCRYPTED_IVMS101_BASE64"
  }'
```

## 5. Call OwnerCheck

```bash
curl -X POST https://api.transight.io/v1/owner-check/kakaopay \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "ownerCheckId": "oc-20260821-0001",
    "currency": "XRP",
    "address": "r...",
    "tag": "12345",
    "originatorVaspEntityId": "bank-a",
    "payload": "ENCRYPTED_OWNER_CHECK_PAYLOAD",
    "policy": {
      "requireDobMatch": true,
      "nameMatchingPolicy": "normalized-exact"
    }
  }'
```

## Next

- [VASP Registry](/en/api/vasp-registry)
- [Transfer Authorization](/en/api/transfer-auth)
- [OwnerCheck](/en/api/owner-check)

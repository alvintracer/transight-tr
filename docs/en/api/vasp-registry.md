# VASP Registry

VASP Registry is the Bonanza TTR public-key directory. It manages VASP endpoints, channels, health, capabilities, and Ed25519 public keys.

## List

```http
GET /vasp-registry
```

Query:

| Query | Description |
| --- | --- |
| `alliance` | `bonanza`, `code`, `code-compatible`, etc. |
| `country` | ISO country code |
| `search` | Name search |
| `wallet` | Candidate search based on transfer metadata |

## Get One

```http
GET /vasp-registry?id={vaspEntityId}
```

## Public Key Search

```http
GET /vasp-registry/pubkey/{vaspEntityId}
```

```json
{
  "vaspEntityId": "kakaopay",
  "vaspName": "KakaoPay",
  "allianceName": "bonanza",
  "health": "up",
  "keys": [
    {
      "pubkey": "BASE64_ED25519_VERIFY_KEY",
      "algorithm": "Ed25519",
      "keyPurpose": "both",
      "encryptionDerivation": "ed25519_to_x25519",
      "encryptionSuite": "X25519-XSalsa20-Poly1305",
      "kid": "kp-2026-01",
      "version": 1,
      "expiresAt": null,
      "isActive": true
    }
  ]
}
```

## Register

```http
POST /vasp-registry
```

```json
{
  "vasp_entity_id": "kakaopay",
  "vasp_name": "KakaoPay",
  "vasp_legal_name": "Kakao Pay Corp.",
  "country_of_registration": "KR",
  "alliance_name": "bonanza",
  "endpoint_url": "https://partner.example.com/ttr",
  "channel_type": "mTLS",
  "public_key": "BASE64_ED25519_VERIFY_KEY",
  "public_key_expires_at": null,
  "key_purpose": "both",
  "kid": "kp-2026-01",
  "metadata": {
    "capabilities": {
      "travelRule": true,
      "ownerCheck": true
    }
  }
}
```

## Update

```http
PUT /vasp-registry
```

Updatable fields:

- `vasp_name`
- `vasp_legal_name`
- `country_of_registration`
- `alliance_name`
- `endpoint_url`
- `channel_type`
- `health`
- `metadata`

## Rotate Key

```http
POST /vasp-registry/rotate-key
```

```json
{
  "vasp_entity_id": "kakaopay",
  "new_public_key": "NEW_BASE64_ED25519_VERIFY_KEY",
  "key_purpose": "both",
  "kid": "kp-2026-02",
  "expires_at": null
}
```

## Deprecated

```http
POST /vasp-registry/address-verify
```

This endpoint returns `ADDRESS_VERIFY_REPLACED`. Use [OwnerCheck](/en/api/owner-check) for identical account-owner verification.

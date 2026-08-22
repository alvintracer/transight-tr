# VASP Registry

VASP Registry는 TravelSafer의 공개키 디렉터리입니다. VASP endpoint, channel, health, capability, Ed25519 public key를 관리합니다.

## List

```http
GET /vasp-registry
```

Query:

| Query | 설명 |
| --- | --- |
| `alliance` | `bonanza`, `code`, `code-compatible` 등 |
| `country` | ISO 국가 코드 |
| `search` | 이름 검색 |
| `wallet` | 기존 transfer metadata 기반 후보 검색 |

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

수정 가능 필드:

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

이 endpoint는 `ADDRESS_VERIFY_REPLACED`를 반환합니다. 동일 계정주 검증은 [OwnerCheck](/ko/api/owner-check)를 사용합니다.

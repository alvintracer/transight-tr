# 빠른 시작

이 예시는 Bonanza TTR의 기본 흐름을 보여줍니다.

## 1. VASP 등록

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

## 2. 수신 VASP 공개키 조회

```bash
curl "https://api.transight.io/v1/vasp-registry/pubkey/kakaopay" \
  -H "Authorization: Bearer $API_KEY"
```

응답의 `pubkey`는 Base64 Ed25519 verify key입니다. 암호화 클라이언트는 이 key에서 X25519 key를 derive합니다.

## 3. IVMS101 payload 암호화

송신 기관은 수신 VASP public key로 IVMS101 payload를 암호화합니다.

```text
Ed25519 public key -> X25519 public key
IVMS101 JSON -> NaCl box -> ENCRYPTED_IVMS101_BASE64
```

## 4. Transfer Authorization 호출

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

## 5. OwnerCheck 호출

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

## 다음 문서

- [VASP Registry](/ko/api/vasp-registry)
- [Transfer Authorization](/ko/api/transfer-auth)
- [OwnerCheck](/ko/api/owner-check)

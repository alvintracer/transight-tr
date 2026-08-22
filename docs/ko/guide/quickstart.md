# 빠른 시작

이 예시는 TravelSafer의 기본 연동 흐름을 보여줍니다.

## 0. SDK 설치

```bash
npm install @bonanza/ttr-sdk
npx travelsafer init --vasp-id your-vasp-id --base-url https://api.transight.io/v1
```

CLI는 `travelsafer.config.json`, `.env.travelsafer.example`, TypeScript 연동 예제를 생성합니다.

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

## 2. 수신 VASP Public Key 조회

```bash
curl "https://api.transight.io/v1/vasp-registry/pubkey/kakaopay" \
  -H "Authorization: Bearer $API_KEY"
```

응답의 `pubkey` 필드는 Base64 Ed25519 verify key입니다. 암호화 client는 이 key에서 X25519 key를 derive합니다.

## 3. IVMS101 Payload 암호화

송신 기관은 수신 VASP public key로 IVMS101 payload를 암호화합니다.

```text
Ed25519 public key -> X25519 public key
IVMS101 JSON -> NaCl box -> ENCRYPTED_IVMS101_BASE64
```

SDK를 쓰는 경우:

```ts
import { TravelSaferClient, encryptPayload } from '@bonanza/ttr-sdk';

const client = new TravelSaferClient({
  baseUrl: 'https://api.transight.io/v1',
  apiKey: process.env.TRAVELSAFER_API_KEY,
  vaspEntityId: 'bank-a',
  signingPrivateKey: process.env.TRAVELSAFER_PRIVATE_KEY,
});

const beneficiary = await client.getPublicKey('kakaopay');
const beneficiaryPublicKey = beneficiary.keys[0]?.pubkey;

const payload = await encryptPayload(
  { ivms101: { /* IVMS101 payload */ } },
  process.env.TRAVELSAFER_PRIVATE_KEY!,
  beneficiaryPublicKey!
);
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

## Next

- [VASP Registry](/ko/api/vasp-registry)
- [Transfer Authorization](/ko/api/transfer-auth)
- [OwnerCheck](/ko/api/owner-check)

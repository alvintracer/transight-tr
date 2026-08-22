# 암호화

TravelSafer의 암호화 모델은 CodeVASP 원본 구조를 기준으로 합니다.

## Key Interpretation

Registry에 저장되는 key는 Base64 Ed25519 verify key입니다.

```text
signature verification = Ed25519 public key
payload encryption = Ed25519 public key -> X25519 public key derive
payload decryption = Ed25519 private key -> X25519 private key derive
```

## Payload Encryption

```text
sender Ed25519 private key -> sender X25519 private key
receiver Ed25519 public key -> receiver X25519 public key
IVMS101 JSON -> XSalsa20-Poly1305 / NaCl box
```

암호화 결과는 Base64 문자열로 `payload` 필드에 담아 `transfer-auth` 또는 `owner-check`에 전달합니다.

## TravelSafer Boundary

TravelSafer은 다음 정보를 운영합니다.

- transfer id
- VASP entity id
- asset, amount, address metadata
- routing endpoint
- KYT result
- relay result
- audit metadata

PII 원문은 수신 VASP public key로 암호화된 payload 안에 있어야 합니다.

## OwnerCheck Payload

OwnerCheck v1은 암호화 payload relay를 기본값으로 둡니다. payload 내부 schema는 기관별 정책에 맞춰 확정하되, 최소 권장 필드는 다음과 같습니다.

```json
{
  "name": "홍길동",
  "dateOfBirth": "1990-01-01",
  "address": "r...",
  "asset": "XRP",
  "network": "xrp"
}
```

향후 salted hash 또는 PSI 기반 비교는 v2 옵션으로 분리합니다.

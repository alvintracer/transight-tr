# 인증

## Ed25519 서명 기반 인증

TranSight TR은 모든 TR 메시지 교환에 **Ed25519 디지털 서명**을 사용합니다.

## 서명 생성 흐름

```
1. datetime = ISO8601 UTC 현재 시각
2. nonce = 랜덤 정수 (100초 내 중복 불가)
3. body = 요청 본문 (JSON string)
4. data = concat(datetime_bytes, body_bytes, nonce_4bytes_bigendian)
5. signature = Ed25519.sign(data, signing_key)
6. 헤더에 포함
```

## 필수 헤더

| 헤더 | 예시 |
|------|------|
| `X-Code-Req-Datetime` | `2026-06-01T15:10:00.000Z` |
| `X-Code-Req-Nonce` | `1234567890` |
| `X-Code-Req-PubKey` | `Base64(Ed25519 public key)` |
| `X-Code-Req-Signature` | `Base64(signature)` |
| `X-Request-Origin` | `transight:my-vasp-id` |

## TypeScript 구현

```typescript
import { createRequestHeaders } from '@transight/utils/signature';

const headers = createRequestHeaders({
  privateKey: process.env.TRANSIGHT_PRIVATE_KEY!,
  vaspEntityId: 'my-vasp-id',
  body: JSON.stringify(requestBody),
  allianceName: 'transight',
});
```

## Nonce 규칙

- 4바이트 Big-Endian unsigned integer로 변환
- 100초 이내에 동일한 nonce 재사용 불가
- 서버는 nonce 중복을 검증하고 거부할 수 있음

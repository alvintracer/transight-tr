# 암호화

TranSight TR의 종단간 암호화(E2EE) 가이드. IVMS101 PII 데이터는 수신 VASP만 복호화할 수 있습니다.

## 암호화 알고리즘

| 항목 | 알고리즘 | 용도 |
|------|----------|------|
| **키 교환** | X25519 | Ed25519 키쌍에서 Curve25519로 변환 |
| **대칭 암호화** | XSalsa20-Poly1305 | IVMS101 PII 암호화 |
| **서명** | Ed25519 | CODE VASP 헤더 서명 |
| **KYT 인증** | HMAC-SHA256 | TranSight KYT API 인증 |

## NaCl Box 암호화

IVMS101 payload 암호화에 **NaCl Box** (Networking and Cryptography library)를 사용합니다.

### 암호화 흐름

```
1. 송신 VASP: Ed25519 signing key → Curve25519 private key 변환
2. 수신 VASP: Ed25519 verify key → Curve25519 public key 변환 (Registry에서 조회)
3. NaCl Box 암호화: nonce(24B) + ciphertext
4. Base64 인코딩 → payload 필드에 포함
```

### 구현 예시 (Node.js)

```typescript
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';
import ed2curve from 'ed2curve';

// 1. Ed25519 키쌍 생성
const keyPair = nacl.sign.keyPair();

// 2. Curve25519 변환
const myPrivate = ed2curve.convertSecretKey(keyPair.secretKey);
const theirPublic = ed2curve.convertPublicKey(receiverEd25519PublicKey);

// 3. IVMS101 PII 암호화
const nonce = nacl.randomBytes(24);
const message = new TextEncoder().encode(JSON.stringify(ivms101Data));

const encrypted = nacl.box(message, nonce, theirPublic, myPrivate);

// 4. nonce + ciphertext → Base64
const payload = encodeBase64(
  new Uint8Array([...nonce, ...encrypted])
);

// → 이 payload를 transfer-auth 요청의 payload 필드에 사용
```

### 복호화 (수신 VASP)

```typescript
// payload에서 nonce(24B) + ciphertext 분리
const raw = decodeBase64(payload);
const nonce = raw.slice(0, 24);
const ciphertext = raw.slice(24);

// 송신 VASP의 공개키로 복호화
const myPrivate = ed2curve.convertSecretKey(mySigningKey);
const theirPublic = ed2curve.convertPublicKey(senderEd25519PublicKey);

const decrypted = nacl.box.open(ciphertext, nonce, theirPublic, myPrivate);
const ivms101 = JSON.parse(new TextDecoder().decode(decrypted));
```

## CODE VASP 헤더 서명

CODE VASP 호환 API 호출 시 다음 헤더가 필요합니다:

```
X-Code-Req-Datetime: ISO8601 UTC
X-Code-Req-Nonce: 랜덤 4바이트 (100초 내 중복 불가)
X-Code-Req-PubKey: Ed25519 공개키 (Base64)
X-Code-Req-Signature: Ed25519 서명 (Base64)
```

### 서명 생성 규칙

```typescript
const datetimeBytes = new TextEncoder().encode(datetime);
const bodyBytes = new TextEncoder().encode(JSON.stringify(body));
const nonceBytes = new Uint8Array(4);
new DataView(nonceBytes.buffer).setUint32(0, nonce, false); // Big-endian

const message = new Uint8Array([
  ...datetimeBytes,
  ...bodyBytes,
  ...nonceBytes,
]);

const signature = nacl.sign.detached(message, signingKey);
```

## KYT API 인증 (HMAC-SHA256)

TranSight KYT API는 HMAC-SHA256 서명 기반으로 인증합니다:

```typescript
const timestamp = new Date().toISOString();
const body = JSON.stringify(requestBody);
const data = `${timestamp}${body}`;

const key = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(apiKey),
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign']
);

const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
// → X-Signature 헤더에 hex 인코딩 포함
```

## Hub의 PII 접근 범위

TranSight Hub는 **PII 원문을 보지 않습니다**:

| 구분 | Hub 접근 | 예시 |
|------|----------|------|
| ✅ **메타데이터** | 접근 가능 | `walletAddress`, `amount`, `currency`, `vaspId` |
| 🔒 **PII** | 접근 불가 | `name`, `dateOfBirth`, `address` (NaCl Box 암호화) |

```
[송신 VASP]
    │
    │ IVMS101 PII → NaCl Box 암호화 (수신 VASP 공개키)
    │ 메타데이터 → 평문
    │
    ▼
[TranSight Hub] ← 메타데이터만 읽고 라우팅/KYT 처리
    │
    │ 암호화된 PII → 그대로 전달
    │
    ▼
[수신 VASP] ← 자신의 개인키로 복호화
```

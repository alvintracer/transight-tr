# Encryption

TranSight TR end-to-end encryption (E2EE) guide. IVMS101 PII data can only be decrypted by the beneficiary VASP.

## Algorithms

| Component | Algorithm | Usage |
|-----------|-----------|-------|
| **Key Exchange** | X25519 | Convert Ed25519 keys to Curve25519 |
| **Symmetric Encryption** | XSalsa20-Poly1305 | IVMS101 PII encryption |
| **Signing** | Ed25519 | CODE VASP header signatures |
| **KYT Auth** | HMAC-SHA256 | TranSight KYT API authentication |

## NaCl Box Encryption

IVMS101 payloads are encrypted using **NaCl Box** (Networking and Cryptography library).

### Encryption Flow

```
1. Originator: Ed25519 signing key → Curve25519 private key
2. Beneficiary: Ed25519 verify key → Curve25519 public key (from Registry)
3. NaCl Box encrypt: nonce(24B) + ciphertext
4. Base64 encode → payload field
```

### Implementation (Node.js)

```typescript
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';
import ed2curve from 'ed2curve';

// 1. Generate Ed25519 key pair
const keyPair = nacl.sign.keyPair();

// 2. Convert to Curve25519
const myPrivate = ed2curve.convertSecretKey(keyPair.secretKey);
const theirPublic = ed2curve.convertPublicKey(receiverEd25519PublicKey);

// 3. Encrypt IVMS101 PII
const nonce = nacl.randomBytes(24);
const message = new TextEncoder().encode(JSON.stringify(ivms101Data));
const encrypted = nacl.box(message, nonce, theirPublic, myPrivate);

// 4. nonce + ciphertext → Base64
const payload = encodeBase64(new Uint8Array([...nonce, ...encrypted]));
```

### Decryption (Beneficiary VASP)

```typescript
const raw = decodeBase64(payload);
const nonce = raw.slice(0, 24);
const ciphertext = raw.slice(24);

const myPrivate = ed2curve.convertSecretKey(mySigningKey);
const theirPublic = ed2curve.convertPublicKey(senderEd25519PublicKey);

const decrypted = nacl.box.open(ciphertext, nonce, theirPublic, myPrivate);
const ivms101 = JSON.parse(new TextDecoder().decode(decrypted));
```

## Hub PII Access Scope

TranSight Hub **never sees PII plaintext**:

| Category | Hub Access | Examples |
|----------|-----------|----------|
| ✅ **Metadata** | Accessible | `walletAddress`, `amount`, `currency`, `vaspId` |
| 🔒 **PII** | Inaccessible | `name`, `dateOfBirth`, `address` (NaCl Box encrypted) |

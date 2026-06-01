# 암호화

::: warning 🚧 작성 중
Phase 3 구현 시 상세 업데이트됩니다.
:::

## NaCl Box

TranSight TR은 IVMS101 payload 암호화에 **NaCl Box**를 사용합니다.

| 항목 | 알고리즘 |
|------|---------|
| 키교환 | X25519 (Ed25519 → Curve25519 변환) |
| 암호화 | XSalsa20-Poly1305 |
| 서명 | Ed25519 |

## 암호화 흐름

```
1. 송신 VASP: Ed25519 signing key → Curve25519 private key 변환
2. 수신 VASP: Ed25519 verify key → Curve25519 public key 변환
3. NaCl Box 암호화: nonce(24B) + ciphertext
4. Base64 인코딩 → payload 필드에 포함
```

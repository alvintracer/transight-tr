# 아키텍처

TravelSafer의 아키텍처는 공개키 디렉터리, 암호화 relay, 금융기관용 ingress, KYT Gate, 감사 저장소로 구성됩니다.

```text
Financial Institution / VASP
        |
        | HTTPS / mTLS / VPN / leased line
        v
TravelSafer
  - VASP Registry
  - Public Key Directory
  - Transfer Relay
  - OwnerCheck Relay
  - KYT Atomic Gate
  - Status / Audit / TTL Queue
        |
        v
Beneficiary VASP Endpoint
```

## 구성 요소

| 구성 | 역할 |
| --- | --- |
| `vasp-registry` | VASP 등록, endpoint 관리, public key 조회, key rotation |
| `transfer-auth` | 출금/입금 Travel Rule relay |
| `owner-check` | 동일 계정주 확인 relay |
| `protocol-adapter` | Bonanza/CodeVASP-compatible outbound relay |
| `kyt-gate` | PII relay 전 KYT block 판단 |
| PostgreSQL | VASP, public key, transfer, owner check, audit metadata 저장 |

## Public Key Model

Registry에 저장하는 canonical key는 Base64 Ed25519 verify key입니다.

```text
public_keys.algorithm = Ed25519
public_keys.key_purpose = both | signing | encryption
metadata.encryptionDerivation = ed25519_to_x25519
metadata.encryptionSuite = X25519-XSalsa20-Poly1305
```

암호화 클라이언트는 Ed25519 public key에서 X25519/Curve25519 public key를 derive해 IVMS101 payload를 암호화합니다.

## Status Boundary

TravelSafer은 routing metadata와 감사 정보를 운영합니다. IVMS101 PII 원문은 송신 기관이 수신 VASP 공개키로 암호화한 뒤 전달합니다.

OwnerCheck payload도 같은 원칙을 따릅니다. v1에서는 암호화 payload relay를 기본으로 하고, 향후 salted hash 또는 PSI 방식은 별도 확장으로 둡니다.

# API 개요

상세 기준 문서: [`docs/ttr-api-specification.md`](../../ttr-api-specification.md)

## Base URL

```text
https://api.transight.io/v1
```

## 인증

기관 간 서버 통신에는 서비스 credential과, 필요한 경우 CodeVASP 호환 요청 서명을 함께 사용합니다.

```http
Authorization: Bearer <TRANSIGHT_API_KEY>
```

## 엔드포인트

### System

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/health` | 시스템 health check |

### VASP Registry

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/vasp-registry` | VASP 목록 조회 |
| `GET` | `/vasp-registry?id={vaspEntityId}` | VASP 상세 조회 및 공개키 조회 |
| `GET` | `/vasp-registry/pubkey/{vaspEntityId}` | 활성 Ed25519 공개키 조회 |
| `POST` | `/vasp-registry` | VASP 및 최초 공개키 등록 |
| `PUT` | `/vasp-registry` | VASP 메타데이터와 endpoint 수정 |
| `DELETE` | `/vasp-registry?id={vaspEntityId}` | VASP 삭제 |
| `POST` | `/vasp-registry/rotate-key` | 공개키 rotation |

### Transfer Authorization

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/transfer-auth` | 출금 Travel Rule relay |
| `POST` | `/transfer-auth/incoming` | 입금 암호화 Travel Rule 수신 |
| `GET` | `/transfer-auth?id={transferId}` | Transfer 상태 조회 |
| `POST` | `/transfer-auth/result` | TXID 보고 |
| `POST` | `/transfer-auth/finish` | Transfer 취소 |

### OwnerCheck

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/owner-check` | 동일 계정주 검증 relay |
| `POST` | `/owner-check/{beneficiaryVaspEntityId}` | path로 수신 VASP를 지정하는 OwnerCheck |
| `GET` | `/owner-check?id={ownerCheckId}` | OwnerCheck 상태 조회 |

## 핵심 규칙

- Registry public key는 Base64 Ed25519 verify key입니다.
- 암호화는 Ed25519 key에서 X25519/Curve25519 key를 derive해 수행합니다.
- `POST /transfer-auth`는 `beneficiaryVaspEntityId`와 활성 수신자 공개키가 반드시 필요합니다.
- `pending`은 자동으로 `verified`로 바꾸지 않습니다.
- 기존 `POST /vasp-registry/address-verify`는 OwnerCheck로 대체합니다.

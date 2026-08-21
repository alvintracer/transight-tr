# API 개요

Bonanza TTR API는 CodeVASP 구조를 토대로 한 Travel Rule relay, VASP public key directory, OwnerCheck, KYT Gate를 제공합니다.

## Base URL

```text
https://api.transight.io/v1
```

## Authentication

기관 간 서버 통신은 발급된 API credential을 기본으로 사용합니다. Travel Rule relay 요청은 필요한 경우 CodeVASP-compatible request signing을 함께 적용합니다.

```http
Authorization: Bearer <BONANZA_TTR_API_KEY>
```

## Endpoints

### System

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Gateway health check |

### VASP Registry

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/vasp-registry` | VASP 목록 조회 |
| `GET` | `/vasp-registry?id={vaspEntityId}` | VASP 상세 및 public key 조회 |
| `GET` | `/vasp-registry/pubkey/{vaspEntityId}` | active Ed25519 public key 조회 |
| `POST` | `/vasp-registry` | VASP와 최초 public key 등록 |
| `PUT` | `/vasp-registry` | VASP metadata와 endpoint 수정 |
| `DELETE` | `/vasp-registry?id={vaspEntityId}` | VASP 삭제 |
| `POST` | `/vasp-registry/rotate-key` | public key rotation |

### Transfer Authorization

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/transfer-auth` | 출금 Travel Rule relay |
| `POST` | `/transfer-auth/incoming` | 입금 encrypted Travel Rule 수신 |
| `GET` | `/transfer-auth?id={transferId}` | Transfer 상태 조회 |
| `POST` | `/transfer-auth/result` | txHash 보고 |
| `POST` | `/transfer-auth/finish` | 수신 검증 결과 또는 종료 처리 |

### OwnerCheck

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/owner-check` | 동일 계정주 검증 relay |
| `POST` | `/owner-check/{beneficiaryVaspEntityId}` | path로 수신 VASP를 지정하는 OwnerCheck |
| `GET` | `/owner-check?id={ownerCheckId}` | OwnerCheck 상태 조회 |

## Core Rules

- Registry public key는 Base64 Ed25519 verify key입니다.
- 암호화는 Ed25519 key에서 X25519/Curve25519 key를 derive해 수행합니다.
- `POST /transfer-auth`는 `beneficiaryVaspEntityId`와 active beneficiary public key가 필요합니다.
- `pending`은 자동으로 `verified`로 바뀌지 않습니다.
- 기존 `POST /vasp-registry/address-verify`는 OwnerCheck로 대체합니다.
- GTR, Sumsub, VerifyVASP adapter는 core data plane에서 비활성입니다.

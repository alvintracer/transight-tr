# API 개요

TravelSafer API는 공개키 디렉터리, 암호화된 Travel Rule relay, OwnerCheck, KYT Gate를 제공합니다.

상세 스펙의 기준 문서는 [`docs/ttr-api-specification.md`](../../ttr-api-specification.md)입니다.

## Base URL

```text
https://api.transight.io/v1
```

## Authentication

기관 간 서버 통신은 발급된 API credential을 기본으로 사용합니다. 금융기관 채널은 계약 구조와 보안 요구에 따라 mTLS, VPN/IPsec, 전용성 회선, 구간 암호화를 함께 적용할 수 있습니다.

```http
Authorization: Bearer <TRAVELSAFER_API_KEY>
```

## Endpoints

### System

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Service health check |

### VASP Registry

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/vasp-registry` | VASP 목록과 상태 조회 |
| `GET` | `/vasp-registry/{vaspEntityId}` | 단일 VASP 조회 |
| `GET` | `/vasp-registry/public-key` | active public key 조회 |
| `POST` | `/vasp-registry` | VASP 등록 |
| `PATCH` | `/vasp-registry/{vaspEntityId}` | VASP metadata 수정 |
| `POST` | `/vasp-registry/{vaspEntityId}/rotate-key` | public key rotation |

### Transfer Authorization

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/transfer-auth` | 출금 Travel Rule relay |
| `POST` | `/transfer-auth/incoming` | 입금 encrypted Travel Rule 수신 |
| `GET` | `/transfer-auth?id={transferId}` | transfer 상태 조회 |
| `POST` | `/transfer-auth/{transferId}/result` | txHash와 결과 보고 |
| `POST` | `/transfer-auth/{transferId}/finish` | transfer 종료 처리 |

### OwnerCheck

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/owner-check` | 동일 계정주 검증 요청 |
| `POST` | `/owner-check/{beneficiaryVaspEntityId}` | path로 수신 VASP를 지정하는 OwnerCheck |
| `GET` | `/owner-check?id={ownerCheckId}` | OwnerCheck 상태 조회 |

## Legacy

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/transfer-response` | 기존 응답 흐름 호환용 |

기존 `POST /vasp-registry/address-verify`는 OwnerCheck로 대체합니다.

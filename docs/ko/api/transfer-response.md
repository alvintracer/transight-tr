# Transfer Response

`transfer-response`는 이전 수신 VASP 응답 흐름을 위한 compatibility API입니다. 2026-08 redesign 이후 신규 연동의 기본 경로는 `transfer-auth`와 `owner-check`입니다.

## Current Position

| 구분 | 정책 |
|------|------|
| 신규 Travel Rule relay | `POST /transfer-auth` |
| 수신 요청 접수 | `POST /transfer-auth/incoming` |
| 수신 검증 결과 | `POST /transfer-auth/finish` 또는 운영 webhook |
| 동일 계정주 검증 | `POST /owner-check` |
| 기존 응답 API | legacy compatibility로만 유지 |

## Legacy Endpoints

기존 연동처가 이미 아래 형태로 구현되어 있을 때만 사용합니다.

```http
POST /transfer-response/confirm
POST /transfer-response/deny
POST /transfer-response/beneficiary
GET  /transfer-response/pending
POST /transfer-response/webhook
```

## Migration Guide

새 연동은 다음 기준으로 옮깁니다.

| Legacy concept | New API |
|----------------|---------|
| 수신 VASP의 verify/deny 응답 | `POST /transfer-auth/finish` |
| 송신 VASP의 상태 조회 | `GET /transfer-auth?id={transferId}` |
| txHash 보고 | `POST /transfer-auth/result` |
| 주소/계정주 사전 확인 | `POST /owner-check` |

## Response Contract

레거시 응답은 기존 partner contract를 깨지 않기 위해 최소 상태만 반환합니다.

```json
{
  "result": "success",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "verified"
}
```

## Notes

- 이 API에는 신규 기능을 추가하지 않습니다.
- GTR, Sumsub, VerifyVASP adapter를 호출하는 data plane으로 사용하지 않습니다.
- 신규 금융기관 및 VASP 문서에는 `transfer-auth`와 `owner-check`를 기준으로 안내합니다.

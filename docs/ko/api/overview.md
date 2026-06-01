# API 개요

## Base URL

```
https://<your-project>.supabase.co/functions/v1
```

## 인증

모든 API 요청에는 `Authorization` 헤더가 필요합니다:

```http
Authorization: Bearer <SUPABASE_ANON_KEY>
```

::: tip
서비스 간 통신에서는 `SUPABASE_SERVICE_ROLE_KEY`를 사용하여 RLS를 우회할 수 있습니다.
:::

## 엔드포인트 목록

### 운영 API

| 메서드 | 경로 | 설명 | 상태 |
|--------|------|------|------|
| `GET` | `/health` | 시스템 헬스체크 | ✅ 완료 |
| `GET` | `/vasp-registry` | VASP 목록 조회 | ✅ 완료 |
| `GET` | `/vasp-registry?id={id}` | VASP 상세 조회 | ✅ 완료 |
| `POST` | `/vasp-registry` | VASP 등록 | ✅ 완료 |
| `POST` | `/transfer-auth` | 전송 인가 요청 | 🔧 스켈레톤 |
| `GET` | `/transfer-auth?id={id}` | 전송 상태 조회 | 🔧 스켈레톤 |

### 예정 API

| 메서드 | 경로 | 설명 | 단계 |
|--------|------|------|------|
| `POST` | `/transfer-result` | 전송 결과 보고 (TXID) | Phase 3 |
| `POST` | `/transfer-finish` | 전송 취소/완료 | Phase 3 |
| `POST` | `/address-search` | 지갑 주소 VASP 탐색 | Phase 2 |
| `POST` | `/address-verify` | 수신인 검증 | Phase 2 |

## 공통 응답 형식

### 성공 응답

```json
{
  "status": "up",
  "timestamp": "2026-06-01T13:42:49.819Z",
  "data": { ... }
}
```

### 에러 응답

```json
{
  "error": "TRANSFER_NOT_FOUND",
  "message": "Transfer with ID 'abc-123' not found",
  "timestamp": "2026-06-01T13:42:49.819Z"
}
```

## 요청 헤더 (CODE VASP 호환)

TR 메시지 교환 시 다음 헤더가 필요합니다:

| 헤더 | 필수 | 설명 |
|------|------|------|
| `X-Code-Req-Datetime` | ✅ | ISO8601 UTC (e.g., `2026-06-01T15:10Z`) |
| `X-Code-Req-Nonce` | ✅ | 랜덤 논스 (100초 내 중복 불가) |
| `X-Code-Req-PubKey` | ✅ | 송신 VASP Ed25519 공개키 (Base64) |
| `X-Code-Req-Remote-PubKey` | ⬜ | 수신 VASP 공개키 (암호화 API만) |
| `X-Code-Req-Signature` | ✅ | Ed25519 서명 (Base64) |
| `X-Request-Origin` | ✅ | `솔루션:엔티티ID` (e.g., `transight:my-vasp`) |

### 서명 생성 규칙

```
signature = Ed25519.sign(
  concat(datetime_bytes, body_bytes, nonce_4bytes_bigendian),
  signing_key
)
```

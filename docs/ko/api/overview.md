# API 개요

## Base URL

```
https://api.transight.io/v1
```

## 인증

모든 API 요청에는 `Authorization` 헤더가 필요합니다:

```http
Authorization: Bearer <TRANSIGHT_API_KEY>
```

::: tip
서비스 간 내부 통신 및 배치 작업 시에는 서비스 키(`<TRANSIGHT_SERVICE_KEY>`)를 사용하여 보안 권한을 강화할 수 있습니다.
:::

## 엔드포인트 목록

### 시스템

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/health` | 시스템 헬스체크 |

### VASP Registry

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/vasp-registry` | VASP 목록 조회 |
| `GET` | `/vasp-registry?id={id}` | VASP 상세 조회 |
| `POST` | `/vasp-registry` | VASP 등록 |
| `POST` | `/vasp-registry/keys` | 공개키 등록 |

### Transfer Authorization (출금)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/transfer-auth` | 출금 TR 인가 요청 (KYT + IVMS101) |
| `POST` | `/transfer-auth/incoming` | 입금 TR 수신 |
| `GET` | `/transfer-auth?id={id}` | Transfer 상태 조회 |
| `POST` | `/transfer-auth/result` | 전송 결과 보고 (TXID) |
| `POST` | `/transfer-auth/finish` | 전송 취소 |

### Transfer Response (수신)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/transfer-response/confirm` | 수신인 확인 (MATCHED) |
| `POST` | `/transfer-response/deny` | 수신인 거부 (NOT_MATCHED) |
| `POST` | `/transfer-response/beneficiary` | 2차 IVMS101 제공 |
| `GET` | `/transfer-response/pending` | 확인 대기 목록 |
| `GET` | `/transfer-response?id={id}` | 개별 입금 TR 조회 |
| `POST` | `/transfer-response/webhook` | 외부 Webhook 콜백 |

### KYT Block Registry (관리자 전용)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/kyt-block-registry` | ra_code2 차단 대상 등록 |
| `GET` | `/kyt-block-registry?vasp={id}` | 등록된 차단 목록 조회 |
| `DELETE` | `/kyt-block-registry/{id}` | 차단 대상 해제 |

::: warning 관리자 전용
KYT Block Registry API는 `TRANSIGHT_SERVICE_KEY`가 필요합니다. 고객 API 키로는 접근할 수 없습니다.
:::

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

## KYT 운영 모드

VASP별로 KYT 통합 방식을 설정할 수 있습니다:

| 모드 | `kyt_mode` | KYT 수행 | TR 차단 |
|------|------------|----------|---------|
| **TR 전용** | `none` | ❌ | ❌ |
| **KYT 전용** | `kyt_only` | ✅ | ❌ (별도 운영) |
| **원자적 통합** | `atomic` | ✅ | 설정에 따라 |

`atomic` 모드에서 `kyt_auto_block=true`이면 등록된 `ra_code2` 매칭 시 자동 차단됩니다.
`kyt_auto_block=false`이면 KYT 결과만 리턴하고 TR은 그냥 진행됩니다.

→ 자세한 내용은 [Atomic KYT Gate](/ko/guide/kyt-gate)를 참조하세요.

## 8단계 TR 흐름

```
Step 1: 송신 VASP → Hub: 출금 요청 + KYT 설정 확인
Step 2: Hub: KYT Gate (설정에 따라 스킵/결과리턴/차단)
        (BLOCK이면 여기서 종료 — PII 미전송)
Step 3: 송신 VASP → Hub: 1차 IVMS101 (NaCl Box 암호화)
Step 4: Hub → 수신 VASP: 채널 브릿징 (Protocol Adapter)
Step 5: 수신 VASP → Hub → 송신 VASP: 수신인 확인
Step 6: Hub → 수신 VASP: 2차 IVMS101 (쌍방 정보)
Step 7: 송신 VASP → 블록체인: 온체인 전송 (Hub 미경유)
Step 8: 송신 VASP → Hub: TXID 보고 → TTL Queue 매칭
```

# VASP Registry

VASP(가상자산 서비스 제공자) 등록 및 조회 API입니다.

## VASP 목록 조회

등록된 모든 VASP의 목록을 반환합니다.

### 요청

```http
GET /vasp-registry
```

### 응답 — 200 OK

```json
{
  "vasps": [
    {
      "vaspEntityId": "test-exchange-a",
      "vaspName": "Test Exchange A",
      "vaspLegalName": "Test Exchange A Inc.",
      "countryOfRegistration": "KR",
      "allianceName": "code",
      "health": "up",
      "pubkeys": [
        {
          "pubkey": "dGVzdC1wdWJsaWMta2V5...",
          "expiresAt": null
        }
      ]
    }
  ]
}
```

### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `vaspEntityId` | `string` | VASP 고유 식별자 |
| `vaspName` | `string` | 표시 이름 |
| `vaspLegalName` | `string` | 법적 등록명 |
| `countryOfRegistration` | `string` | 등록 국가 (ISO 3166-1 alpha-2) |
| `allianceName` | `string` | 소속 얼라이언스 (`code`, `verifyvasp`, `transight`, `direct`) |
| `health` | `"up" \| "down"` | 연결 상태 |
| `pubkeys` | `array` | Ed25519 공개키 목록 |

---

## VASP 상세 조회

특정 VASP의 상세 정보를 공개키와 함께 반환합니다.

### 요청

```http
GET /vasp-registry?id={vaspEntityId}
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `id` | `string` | ✅ | VASP Entity ID |

### 응답 — 200 OK

```json
{
  "id": "uuid-...",
  "vasp_entity_id": "test-exchange-a",
  "vasp_name": "Test Exchange A",
  "vasp_legal_name": "Test Exchange A Inc.",
  "country_of_registration": "KR",
  "alliance_name": "code",
  "channel_type": "HTTPS",
  "health": "up",
  "public_keys": [
    {
      "id": "uuid-...",
      "public_key": "dGVzdC1wdWJsaWMta2V5...",
      "algorithm": "Ed25519",
      "expires_at": null,
      "is_active": true,
      "created_at": "2026-06-01T13:42:03Z"
    }
  ]
}
```

### 응답 — 404 Not Found

```json
{
  "error": "VASP not found",
  "vaspEntityId": "unknown-vasp"
}
```

---

## VASP 등록

새로운 VASP를 TranSight 네트워크에 등록합니다.

### 요청

```http
POST /vasp-registry
Content-Type: application/json
```

### 요청 본문

```json
{
  "vasp_entity_id": "my-exchange",
  "vasp_name": "My Exchange",
  "vasp_legal_name": "My Exchange Co., Ltd.",
  "country_of_registration": "KR",
  "alliance_name": "transight",
  "endpoint_url": "https://my-exchange.com/tr-api",
  "channel_type": "HTTPS",
  "public_key": "Base64EncodedEd25519PublicKey==",
  "public_key_expires_at": "2027-01-01T00:00:00Z"
}
```

### 요청 필드

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `vasp_entity_id` | `string` | ✅ | 고유 식별자 |
| `vasp_name` | `string` | ✅ | 표시 이름 |
| `vasp_legal_name` | `string` | ⬜ | 법적 등록명 |
| `country_of_registration` | `string` | ✅ | ISO 3166-1 alpha-2 |
| `alliance_name` | `string` | ⬜ | 기본값: `transight` |
| `endpoint_url` | `string` | ✅ | TR API 엔드포인트 |
| `channel_type` | `string` | ⬜ | `HTTPS` \| `mTLS` \| `VPN` \| `LEASED_LINE` |
| `public_key` | `string` | ✅ | Ed25519 공개키 (Base64) |
| `public_key_expires_at` | `string` | ⬜ | 키 만료 시각 (ISO8601) |

### 응답 — 201 Created

```json
{
  "success": true,
  "vasp": {
    "id": "uuid-...",
    "vasp_entity_id": "my-exchange",
    "vasp_name": "My Exchange",
    ...
  }
}
```

### 응답 — 409 Conflict

```json
{
  "error": "VASP entity ID already exists",
  "vasp_entity_id": "my-exchange"
}
```

## 사용 예시

::: code-group

```bash [VASP 목록]
curl -H "Authorization: Bearer $API_KEY" \
  https://api.transight.io/v1/vasp-registry
```

```bash [VASP 등록]
curl -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vasp_entity_id": "my-exchange",
    "vasp_name": "My Exchange",
    "country_of_registration": "KR",
    "endpoint_url": "https://my-exchange.com/tr",
    "public_key": "abc123=="
  }' \
  https://api.transight.io/v1/vasp-registry
```

:::

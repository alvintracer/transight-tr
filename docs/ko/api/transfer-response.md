# Transfer Response

수신(Beneficiary) VASP의 응답 처리 API. 수신인 확인/거부, 2차 IVMS101 교환, Webhook 콜백을 처리합니다.

## 수신인 확인 (MATCHED)

8단계 핸드셰이크의 **Step 5**: 수신 VASP가 수신인을 확인합니다.

```http
POST /transfer-response/confirm
Authorization: Bearer <TRANSIGHT_API_KEY>
```

### 요청 본문

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "beneficiaryPayload": "Base64EncodedBeneficiaryIVMS101"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `transferId` | `string` | ✅ | Transfer ID |
| `beneficiaryPayload` | `string` | ⬜ | 수신인 IVMS101 응답 (암호화) |

### 응답

```json
{
  "result": "confirmed",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "verified",
  "message": "Beneficiary confirmed. Originator VASP notified."
}
```

::: tip 비동기 콜백
수신인 확인 시, 송신 VASP에 자동으로 콜백이 전송됩니다 (`/transfer/callback`).
:::

---

## 수신인 거부 (NOT_MATCHED)

수신인 정보가 일치하지 않는 경우 거부합니다.

```http
POST /transfer-response/deny
Authorization: Bearer <TRANSIGHT_API_KEY>
```

### 요청 본문

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "reasonType": "NOT_MATCHED",
  "reasonMsg": "Beneficiary name does not match"
}
```

### 응답

```json
{
  "result": "denied",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "denied",
  "reasonType": "NOT_MATCHED",
  "reasonMsg": "Beneficiary name does not match"
}
```

---

## 수신인 IVMS101 제공 (2차 교환)

8단계 핸드셰이크의 **Step 6**: 수신인 정보를 포함한 2차 IVMS101을 제공합니다.

```http
POST /transfer-response/beneficiary
Authorization: Bearer <TRANSIGHT_API_KEY>
```

### 요청 본문

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "payload": "Base64EncodedSecondIVMS101",
  "beneficiaryInfo": {
    "name": "홍길동",
    "accountId": "account-123"
  }
}
```

### 응답

```json
{
  "result": "accepted",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Beneficiary IVMS101 data received. Forwarding to originator VASP."
}
```

::: warning 상태 제한
`verified` 상태에서만 2차 IVMS101 제공이 가능합니다. 먼저 `/confirm`으로 수신인 확인이 완료되어야 합니다.
:::

---

## 확인 대기 목록 조회

수신 VASP가 확인 대기 중인 입금 TR 목록을 조회합니다.

```http
GET /transfer-response/pending?vasp={vaspEntityId}&limit=20&offset=0
Authorization: Bearer <TRANSIGHT_API_KEY>
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `vasp` | `string` | ⬜ | VASP Entity ID 필터 |
| `limit` | `number` | ⬜ | 페이지 크기 (기본: 20) |
| `offset` | `number` | ⬜ | 오프셋 (기본: 0) |

### 응답

```json
{
  "transfers": [
    {
      "transferId": "uuid-1",
      "status": "wait",
      "direction": "incoming",
      "currency": "BTC",
      "amount": "0.5",
      "originatorVasp": {
        "vaspEntityId": "external-vasp",
        "vaspName": "External Exchange"
      },
      "createdAt": "2026-06-02T01:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

## 개별 입금 TR 조회

```http
GET /transfer-response?id={transferId}
Authorization: Bearer <TRANSIGHT_API_KEY>
```

---

## Webhook 콜백

외부 솔루션(Sumsub, CODE 등)의 비동기 응답을 수신합니다.

```http
POST /transfer-response/webhook
```

### Sumsub Webhook

```json
{
  "source": "sumsub",
  "type": "travelRule",
  "txnId": "transfer-uuid",
  "status": "completed"
}
```

### CODE Webhook

```json
{
  "source": "code",
  "allianceName": "code",
  "transferId": "transfer-uuid",
  "result": "verified"
}
```

### 범용 Webhook

```json
{
  "transferId": "transfer-uuid",
  "status": "verified"
}
```

### 응답

```json
{
  "received": true,
  "processed": true,
  "transferId": "transfer-uuid",
  "status": "verified"
}
```

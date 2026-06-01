# Transfer Response API

수신 VASP (Beneficiary)의 응답을 처리하는 API입니다.

## 8단계 핸드셰이크 매핑

| 단계 | API |
|------|-----|
| Step 4 | `POST /transfer-auth/incoming` (입금 수신) |
| **Step 5** | `POST /transfer-response/confirm` 또는 `/deny` |
| **Step 6** | `POST /transfer-response/beneficiary` |

## 엔드포인트

### 확인 대기 목록

```http
GET /transfer-response/pending
```

**쿼리 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| vasp | string | VASP Entity ID 필터 |
| limit | number | 페이지 크기 (기본 20) |
| offset | number | 오프셋 |

**응답:**

```json
{
  "transfers": [
    {
      "transferId": "abc-123",
      "status": "wait",
      "direction": "incoming",
      "currency": "ETH",
      "amount": "3.0",
      "originatorVasp": {
        "vasp_name": "Test Exchange A",
        "vasp_entity_id": "test-exchange-a"
      },
      "beneficiaryVasp": {
        "vasp_name": "TranSight Hub",
        "vasp_entity_id": "transight-hub"
      }
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

### 수신인 확인 (MATCHED)

```http
POST /transfer-response/confirm
```

**요청:**

```json
{
  "transferId": "abc-123",
  "beneficiaryPayload": "encrypted-ivms101-response"
}
```

**응답:**

```json
{
  "result": "confirmed",
  "transferId": "abc-123",
  "status": "verified",
  "message": "Beneficiary confirmed. Originator VASP notified."
}
```

---

### 수신인 거부 (NOT_MATCHED)

```http
POST /transfer-response/deny
```

**요청:**

```json
{
  "transferId": "abc-123",
  "reasonType": "NOT_FOUND_ADDRESS",
  "reasonMsg": "No matching wallet address found"
}
```

**응답:**

```json
{
  "result": "denied",
  "transferId": "abc-123",
  "status": "denied",
  "reasonType": "NOT_FOUND_ADDRESS",
  "reasonMsg": "No matching wallet address found"
}
```

---

### 2차 IVMS101 제공 (Step 6)

```http
POST /transfer-response/beneficiary
```

**요청:**

```json
{
  "transferId": "abc-123",
  "payload": "encrypted-beneficiary-ivms101",
  "beneficiaryInfo": {
    "name": "John Doe",
    "accountNumber": "xxxx-xxxx"
  }
}
```

**응답:**

```json
{
  "result": "accepted",
  "transferId": "abc-123",
  "status": "pending",
  "message": "Beneficiary IVMS101 data received. Forwarding to originator VASP."
}
```

---

### Webhook 콜백

```http
POST /transfer-response/webhook
```

외부 TR 솔루션(Sumsub, CODE 등)의 비동기 결과를 수신합니다.

**Sumsub:**

```json
{
  "source": "sumsub",
  "txnId": "abc-123",
  "status": "completed"
}
```

**CODE:**

```json
{
  "source": "code",
  "transferId": "abc-123",
  "result": "verified"
}
```

**범용:**

```json
{
  "transferId": "abc-123",
  "status": "confirmed"
}
```

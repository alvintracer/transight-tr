# Transfer Response API

API for handling beneficiary (receiving VASP) responses.

## 8-Step Handshake Mapping

| Step | API |
|------|-----|
| Step 4 | `POST /transfer-auth/incoming` (receive incoming) |
| **Step 5** | `POST /transfer-response/confirm` or `/deny` |
| **Step 6** | `POST /transfer-response/beneficiary` |

## Endpoints

### List Pending Transfers

```http
GET /transfer-response/pending
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| vasp | string | Filter by VASP Entity ID |
| limit | number | Page size (default 20) |
| offset | number | Offset |

### Confirm Recipient (MATCHED)

```http
POST /transfer-response/confirm
```

```json
{
  "transferId": "abc-123",
  "beneficiaryPayload": "encrypted-ivms101-response"
}
```

### Deny Recipient (NOT_MATCHED)

```http
POST /transfer-response/deny
```

```json
{
  "transferId": "abc-123",
  "reasonType": "NOT_FOUND_ADDRESS",
  "reasonMsg": "No matching wallet address found"
}
```

### Provide Beneficiary IVMS101 (Step 6)

```http
POST /transfer-response/beneficiary
```

```json
{
  "transferId": "abc-123",
  "payload": "encrypted-beneficiary-ivms101",
  "beneficiaryInfo": { "name": "John Doe" }
}
```

### Webhook Callback

```http
POST /transfer-response/webhook
```

Receives async results from external TR solutions (Sumsub, CODE, etc).

**Sumsub:** `{ "source": "sumsub", "txnId": "abc-123", "status": "completed" }`

**CODE:** `{ "source": "code", "transferId": "abc-123", "result": "verified" }`

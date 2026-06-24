# Transfer Status

Query the current status of a Transfer.

## Request

```http
GET /transfer-auth?id={transferId}
Authorization: Bearer <TRANSIGHT_API_KEY>
```

## Response

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "verified",
  "direction": "outgoing",
  "currency": "BTC",
  "amount": "0.5",
  "result": "verified",
  "txid": null,
  "createdAt": "2026-06-02T01:00:00.000Z",
  "updatedAt": "2026-06-02T01:00:05.000Z"
}
```

## Status Transitions

| Status | Description |
|--------|-------------|
| `wait` | Transfer created, awaiting KYT/routing |
| `verified` | Beneficiary confirmed (MATCHED) |
| `denied` | KYT blocked or beneficiary denied |
| `pending` | Second IVMS101 exchange in progress |
| `confirmed` | TXID reported, transfer complete |
| `canceled` | Canceled by user or system |

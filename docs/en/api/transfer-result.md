# Transfer Result

Report the on-chain transaction hash and move a Transfer to `confirmed`.

## Request

```http
POST /transfer-auth/result
Authorization: Bearer <BONANZA_TTR_API_KEY>
Content-Type: application/json
```

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "txid": "0xabc123def456789",
  "vout": "0"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `transferId` | Yes | Transfer ID. |
| `txid` | Yes | Blockchain transaction hash. |
| `vout` | No | UTXO output index when applicable. |

## Response

```json
{
  "result": "success",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "txid": "0xabc123def456789",
  "status": "confirmed"
}
```

## Valid Previous States

Only `verified`, `pending`, `processing`, or `wait-confirmed` Transfers can be confirmed. `denied` and `canceled` Transfers fail.

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_REQUEST` | 400 | `transferId` or `txid` is missing. |
| `TRANSFER_NOT_FOUND` | 404 | Transfer does not exist. |
| `TRANSFER_INVALID_STATUS` | 409 | Current status cannot be confirmed. |

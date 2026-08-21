# Transfer Result

온체인 전송 후 txHash를 보고하고 Transfer를 `confirmed` 상태로 진행합니다.

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

`verified`, `pending`, `processing`, `wait-confirmed` 상태에서 txHash 보고를 허용합니다. `denied` 또는 `canceled` 상태에서는 실패합니다.

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_REQUEST` | 400 | `transferId` 또는 `txid` 누락. |
| `TRANSFER_NOT_FOUND` | 404 | Transfer가 존재하지 않음. |
| `TRANSFER_INVALID_STATUS` | 409 | 현재 상태에서 confirm 불가. |

# Transfer Result

Report blockchain transaction ID (TXID) after on-chain transfer.

## Request

```http
POST /transfer-auth/result
Authorization: Bearer <TRANSIGHT_API_KEY>
```

### Request Body

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "txid": "0xabc123def456789...",
  "vout": "0"
}
```

## Response

```json
{
  "result": "success",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "txid": "0xabc123def456789...",
  "status": "confirmed"
}
```

::: warning Status Restriction
Only Transfers in `verified`, `pending`, or `processing` status can report results.
:::

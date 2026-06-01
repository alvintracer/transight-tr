# Transfer Result

::: warning 🚧 Coming in Phase 3
:::

Report the blockchain TXID after transfer completion.

## Request

```http
POST /transfer-result
```

## Request Body

```json
{
  "transferId": "uuid-v4",
  "txid": "0xabc123...",
  "vout": "0"
}
```

# Transfer Status

::: warning 🚧 Phase 3에서 구현 예정
:::

## 요청

```http
GET /transfer-auth?id={transferId}
```

## 응답

```json
{
  "transferId": "uuid-v4",
  "status": "verified",
  "txid": null
}
```

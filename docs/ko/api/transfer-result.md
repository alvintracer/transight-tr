# Transfer Result

::: warning 🚧 Phase 3에서 구현 예정
:::

블록체인 전송 완료 후 TXID를 보고하는 API입니다.

## 요청

```http
POST /transfer-result
```

## 요청 본문

```json
{
  "transferId": "uuid-v4",
  "txid": "0xabc123...",
  "vout": "0"
}
```

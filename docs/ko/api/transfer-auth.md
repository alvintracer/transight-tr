# Transfer Authorization

::: warning 🚧 Phase 3에서 구현 예정
현재 스켈레톤 상태입니다. Transfer 레코드 생성만 가능합니다.
:::

## 요청

```http
POST /transfer-auth
```

## 요청 본문

```json
{
  "transferId": "uuid-v4",
  "currency": "BTC",
  "amount": "0.5",
  "tradePrice": "50000000",
  "tradeCurrency": "KRW",
  "isExceedingThreshold": true,
  "payload": "Base64EncodedEncryptedIVMS101"
}
```

## 예상 응답

```json
{
  "result": "verified",
  "transferId": "uuid-v4",
  "payload": "Base64EncodedEncryptedResponse"
}
```

자세한 구현은 Phase 3 완료 후 업데이트됩니다.

# Transfer Authorization

::: warning 🚧 Coming in Phase 3
Currently a skeleton. Only creates Transfer records.
:::

## Request

```http
POST /transfer-auth
```

## Request Body

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

## Expected Response

```json
{
  "result": "verified",
  "transferId": "uuid-v4",
  "payload": "Base64EncodedEncryptedResponse"
}
```

Full implementation details will be added after Phase 3 completion.

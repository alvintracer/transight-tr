# Transfer Result

블록체인 전송 완료 후 TXID를 보고하는 API입니다.

## 요청

```http
POST /transfer-auth/result
Authorization: Bearer <TRANSIGHT_API_KEY>
```

### 요청 본문

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "txid": "0xabc123def456789...",
  "vout": "0"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `transferId` | `string` | ✅ | Transfer ID |
| `txid` | `string` | ✅ | 블록체인 트랜잭션 해시 |
| `vout` | `string` | ⬜ | UTXO Output Index (BTC/LTC 등 UTXO 기반 체인) |

## 응답

```json
{
  "result": "success",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "txid": "0xabc123def456789...",
  "status": "confirmed"
}
```

## 상태 전이

```
verified / pending / processing → confirmed
```

TXID 보고 후 Transfer 상태가 `confirmed`로 변경됩니다.

## 에러

| 에러 코드 | HTTP | 설명 |
|-----------|------|------|
| `INVALID_REQUEST` | 400 | `transferId` 또는 `txid` 누락 |
| `TRANSFER_NOT_FOUND` | 404 | Transfer ID 없음 |
| `TRANSFER_INVALID_STATUS` | 400 | 이미 `denied`/`canceled` 상태 |

::: warning 상태 제한
`verified`, `pending`, `processing` 상태에서만 결과 보고가 가능합니다.
:::

## 사용 시점

```
Step 7: 송신 VASP → 블록체인 전송 (온체인)
     ↓
Step 8: 송신 VASP → TranSight Hub: TXID 보고 (이 API)
     ↓
     Hub: Transfer 상태 → confirmed
     Hub: 수신 VASP에 TXID 전달 (TTL Queue 매칭)
```

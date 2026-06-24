# Transfer Status

Transfer의 현재 상태를 조회합니다.

## 요청

```http
GET /transfer-auth?id={transferId}
Authorization: Bearer <TRANSIGHT_API_KEY>
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `id` | `string` | ✅ | Transfer ID (UUID) |

## 응답

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "verified",
  "direction": "outgoing",
  "currency": "BTC",
  "amount": "0.5",
  "tradePrice": "50000000",
  "tradeCurrency": "KRW",
  "result": "verified",
  "reasonType": null,
  "reasonMsg": null,
  "txid": null,
  "createdAt": "2026-06-02T01:00:00.000Z",
  "updatedAt": "2026-06-02T01:00:05.000Z"
}
```

## 상태 전이 다이어그램

```
                    ┌──────────┐
                    │   wait   │ ← Transfer 생성 직후
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
        ┌──────────┐ ┌────────┐ ┌────────┐
        │ verified │ │ denied │ │canceled│
        └────┬─────┘ └────────┘ └────────┘
             │
             ▼
        ┌──────────┐
        │ pending  │ ← 2차 IVMS101 교환 중
        └────┬─────┘
             │
             ▼
        ┌────────────┐
        │ confirmed  │ ← TXID 보고 완료
        └────────────┘
```

## 상태 설명

| 상태 | 설명 |
|------|------|
| `wait` | Transfer 생성 직후. KYT 검증 및 수신 VASP 전달 대기 |
| `verified` | 수신 VASP가 수신인을 확인함 (MATCHED) |
| `denied` | KYT 차단 또는 수신인 불일치 (NOT_MATCHED) |
| `pending` | 2차 IVMS101 교환 진행 중 |
| `processing` | 블록체인 전송 처리 중 |
| `confirmed` | TXID 보고 완료. 최종 정상 완료 |
| `canceled` | 사용자 또는 시스템에 의해 취소됨 |

## Direction

| 값 | 설명 |
|----|------|
| `outgoing` | 출금 (송신 VASP가 생성) |
| `incoming` | 입금 (외부로부터 수신) |

## 에러

| 에러 코드 | HTTP | 설명 |
|-----------|------|------|
| `INVALID_REQUEST` | 400 | `id` 파라미터 누락 |
| `TRANSFER_NOT_FOUND` | 404 | 해당 Transfer ID 없음 |

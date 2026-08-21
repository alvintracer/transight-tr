# Transfer Status

Transfer의 현재 상태와 relay 결과 metadata를 조회합니다.

## Request

```http
GET /transfer-auth?id={transferId}
Authorization: Bearer <BONANZA_TTR_API_KEY>
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `id` | Yes | Transfer ID 또는 client supplied idempotency id. |

## Response

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "verified",
  "direction": "outgoing",
  "originatorVaspEntityId": "kakaopay",
  "beneficiaryVaspEntityId": "global-exchange",
  "currency": "BTC",
  "amount": "0.5",
  "result": "verified",
  "reasonType": null,
  "reasonMsg": null,
  "txid": null,
  "createdAt": "2026-08-21T09:00:00.000Z",
  "updatedAt": "2026-08-21T09:00:03.000Z"
}
```

## Status Values

| Status | Description |
|--------|-------------|
| `wait` | Transfer 생성 후 KYT 또는 routing 대기. |
| `verified` | 수신 VASP가 전송을 승인. |
| `denied` | KYT, 수신 VASP, routing 정책상 거절. |
| `pending` | 추가 IVMS101 또는 운영 처리가 진행 중. |
| `processing` | 온체인 전송 처리 중. |
| `wait-confirmed` | 트랜잭션 기록 후 finality 대기. |
| `confirmed` | txHash 보고 완료. |
| `canceled` | 최종 완료 전 취소. |

## Notes

- `pending`은 자동으로 `verified`로 처리하지 않습니다.
- Bonanza는 routing과 상태 metadata를 저장합니다.
- 금융기관 IDC 채널을 쓰는 경우에도 조회 contract는 동일합니다.

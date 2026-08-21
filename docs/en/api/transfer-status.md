# Transfer Status

Query the current state and relay result metadata for a Transfer.

## Request

```http
GET /transfer-auth?id={transferId}
Authorization: Bearer <BONANZA_TTR_API_KEY>
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `id` | Yes | Transfer ID or client supplied idempotency id. |

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
| `wait` | Transfer created and waiting for KYT or routing. |
| `verified` | Beneficiary VASP authorized the transfer. |
| `denied` | KYT, beneficiary, or routing policy denied the transfer. |
| `pending` | Further IVMS101 or operational processing is in progress. |
| `processing` | On-chain submission is being processed. |
| `wait-confirmed` | Transaction is recorded but finality is not complete. |
| `confirmed` | txHash was reported. |
| `canceled` | Transfer was canceled before final completion. |

## Notes

- `pending` is not automatically treated as `verified`.
- Bonanza stores routing and status metadata.
- Financial-institution IDC channels use the same lookup contract.

# Status Codes

See the [State Machine guide](/en/guide/state-machine) for detailed transition rules.

## Transfer Statuses

| Code | Terminal | Description |
|------|----------|-------------|
| `wait` | No | Waiting for KYT or beneficiary response |
| `verified` | No | Authorized by beneficiary VASP |
| `denied` | Yes | Denied by KYT, routing, or beneficiary policy |
| `pending` | No | Additional verification or operational processing |
| `processing` | No | On-chain submission in progress |
| `wait-confirmed` | No | Awaiting finality after recording |
| `confirmed` | Yes | txHash report completed |
| `canceled` | Yes | Transfer canceled |

## OwnerCheck Statuses

| Code | Terminal | Description |
|------|----------|-------------|
| `pending` | No | Waiting for beneficiary response |
| `verified` | Yes | Same-owner check matched |
| `denied` | Yes | Same-owner check failed or was declined |
| `expired` | Yes | No response within TTL |
| `failed` | Yes | Routing or system error |

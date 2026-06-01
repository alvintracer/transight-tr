# Status Codes

See the [State Machine guide](/en/guide/state-machine) for detailed transition rules.

## Transfer Statuses

| Status | Code | Terminal | Description |
|--------|------|----------|-------------|
| Waiting | `wait` | ❌ | Awaiting beneficiary response |
| Verified | `verified` | ❌ | Authorized by beneficiary |
| Denied | `denied` | ✅ | Denied by beneficiary |
| Pending | `pending` | ❌ | Before blockchain submission |
| Processing | `processing` | ❌ | Submitted to blockchain |
| Wait Confirmed | `wait-confirmed` | ❌ | Mined, no finality |
| Confirmed | `confirmed` | ❌ | Transfer complete |
| Canceled | `canceled` | ✅ | Transfer canceled |

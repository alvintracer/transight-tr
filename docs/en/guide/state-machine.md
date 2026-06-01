# State Machine

Transfer lifecycle is managed through an 8-stage state machine.

## State Diagram

```
  ┌──────┐
  │ WAIT │ ← Initial state when Transfer is created
  └──┬───┘
     │
     ├──────────────┐
     ▼              ▼
┌──────────┐  ┌──────────┐
│ VERIFIED │  │  DENIED  │ ← Terminal state
└────┬─────┘  └──────────┘
     │
     ▼
┌──────────┐
│ PENDING  │
└────┬─────┘
     │
     ▼
┌────────────┐
│ PROCESSING │ ← Submitted to blockchain
└────┬───────┘
     │
     ▼
┌────────────────┐
│ WAIT_CONFIRMED │ ← Awaiting mining
└────┬───────────┘
     │
     ▼
┌───────────┐
│ CONFIRMED │ ← Transfer complete
└───────────┘

* CANCELED is reachable from any state (before blockchain execution)
```

## State Descriptions

| State | Description |
|-------|-------------|
| `wait` | Awaiting beneficiary VASP response |
| `verified` | Beneficiary VASP authorized |
| `denied` | Beneficiary VASP denied (terminal) |
| `pending` | Awaiting blockchain submission |
| `processing` | Submitted to blockchain, awaiting mining |
| `wait-confirmed` | Mined, finality not yet achieved |
| `confirmed` | Transfer complete (TXID updated) |
| `canceled` | Transfer canceled (terminal) |

## Valid State Transitions

| From → | Possible Next States |
|--------|---------------------|
| `wait` | `verified`, `denied` |
| `verified` | `pending`, `canceled` |
| `denied` | *(terminal)* |
| `pending` | `processing`, `canceled` |
| `processing` | `wait-confirmed`, `canceled` |
| `wait-confirmed` | `confirmed`, `canceled` |
| `confirmed` | `canceled` (reorg edge case) |
| `canceled` | *(terminal)* |

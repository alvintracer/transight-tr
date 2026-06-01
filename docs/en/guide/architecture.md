# Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────┐
│                    TranSight Hub                         │
│                                                          │
│  ┌─────────┐   ┌──────────────┐   ┌─────────────────┐   │
│  │ Request  │   │  Processing  │   │ Protocol Adapter│   │
│  │   API    │──▶│    Engine    │──▶│     Layer       │   │
│  └─────────┘   └──────┬───────┘   └────────┬────────┘   │
│                       │                     │            │
│                ┌──────▼───────┐             │            │
│                │  Atomic KYT  │             │            │
│                │    Gate      │             │            │
│                └──────────────┘             │            │
│                                             │            │
│  ┌─────────┐   ┌──────────────┐            │            │
│  │Response  │   │   IVMS101    │            │            │
│  │   API    │◀──│  Validator   │            │            │
│  └─────────┘   └──────────────┘            │            │
└──────────────────────────────────┼──────────┘            │
                                   │                       │
                    ┌──────────────┼───────────────────┐   │
                    │              ▼                    │   │
                    │  ┌────────────────────────────┐   │   │
                    │  │  Asymmetric Bridge Router  │   │   │
                    │  └──┬──────┬──────┬──────┬───┘   │   │
                    │     │      │      │      │       │   │
                    │  ┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐    │   │
                    │  │HTTPS││mTLS ││ VPN ││Lease│    │   │
                    │  └──┬──┘└──┬──┘└──┬──┘└──┬──┘    │   │
                    └─────┼──────┼──────┼──────┼───────┘   │
                          │      │      │      │           │
                      Exchanges Digital Banks  Legacy      │
                              Banks                        │
                                                          │
              ┌───────────────────────────────────────────┘
              │ Protocol Adapters
              ▼
    ┌──────────────────────────────────────┐
    │   CODE    │  VerifyVASP  │  Direct   │
    │  Alliance │  Alliance   │ (Global)  │
    └──────────────────────────────────────┘
```

## Data Flow

### Outgoing Transfer

1. **VASP A** → TranSight Hub: `POST /transfer-auth` (encrypted IVMS101)
2. Hub: KYT check (Atomic Gate)
3. Hub: Discover beneficiary VASP (select Protocol Adapter)
4. Hub → **VASP B**: Forward 1st IVMS101
5. **VASP B** → Hub: Beneficiary verification result
6. Hub → **VASP A**: Return authorization result
7. **VASP A**: Execute blockchain transfer
8. **VASP A** → Hub: `POST /transfer-result` (TXID)

### Incoming Transfer

1. Hub ← External solution: Receive TR message
2. Hub: Protocol conversion (Protocol Adapter)
3. Hub → **VASP B**: Forward via Response API
4. **VASP B** → Hub: Beneficiary verification result
5. Hub → External solution: Forward response

## Next Steps

- [Asymmetric Bridge](./asymmetric-bridge.md) — Channel implementation details
- [State Machine](./state-machine.md) — Transfer lifecycle

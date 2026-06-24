# Atomic KYT Gate

TranSight TR's key differentiator. PII is **never transmitted** before the KYT result is determined.

## Overview

TranSight offers **configurable KYT-TR integration**:

| Mode | Description | KYT Result | TR Proceeds |
|------|-------------|------------|-------------|
| **`none`** | TR only | ❌ No KYT | ✅ Always |
| **`kyt_only`** | KYT only | ✅ Returned | ❌ No TR |
| **`atomic`** | KYT + TR integrated | ✅ Returned | Based on settings |

## Behavior by Mode

### `atomic` + Auto-block ON

```
Outgoing request → KYT API call → Check ra_code2
                                 → Block Registry match?
                                   ├── YES → ⛔ PII not sent, Transfer denied
                                   └── NO  → ✅ TR message proceeds
```

### `atomic` + Auto-block OFF

```
Outgoing request → KYT API call → Return KYT result (ra_code2, riskScore)
                                 → TR proceeds (customer decides manually)
```

### `none` mode

```
Outgoing request → Skip KYT → TR only
```

## VASP Configuration

| Setting | Values | Description |
|---------|--------|-------------|
| `kyt_mode` | `none` / `kyt_only` / `atomic` | KYT operating mode |
| `kyt_scope` | `tr_only` / `all` | Apply KYT to TR transactions only vs all |
| `kyt_auto_block` | `true` / `false` | Auto-block when registered ra_code2 matches |
| `kyt_return_for_sar` | `true` / `false` | Return detailed RA info for SAR reporting |

::: warning Admin Only
KYT settings can only be changed by TranSight administrators.
:::

## ra_code2 Block Registry

### Concept

Register **auto-block target `ra_code2` codes** per VASP. When the KYT response's `ra_code2` matches a registered code, the TR is automatically blocked.

::: tip deny_list only
Block Registry targets **deny_list** `ra_code2` codes only. white_list RA codes are not eligible.
:::

### deny_list ra_code2 (TranSight KYT RA v1.3.3)

| ra_code2 | Description | Risk Level | Score |
|----------|-------------|------------|-------|
| `OIS` | OFAC/International Sanctions | **SEVERE** | 100 |
| `SRA` | Sanctions Related Activity | **SEVERE** | 100 |
| `DIS` | DPRK Sanctions | **SEVERE** | 100 |
| `DT` | Darknet/Terror Financing | **SEVERE** | 100 |
| `CSA` | Child Sexual Abuse Material | **HIGH** | 98.99 |
| `HA` | Hacking Attack | **HIGH** | 66.79 |
| `RW` | Ransomware | **HIGH** | 66.79 |
| `CS` | Crypto Scam | **HIGH** | 66.14 |
| `PS` | Phishing Scam | **HIGH** | 66.14 |
| `CSAC` | Child Exploitation Related | **HIGH** | 60.1 |
| `OG` | Organized Crime | MEDIUM | 47.42 |
| `VP` | Illegal VA Provider | MEDIUM | 45.3 |
| `IAF` | Illicit Asset Flow | MEDIUM | 45.3 |
| `IPT` | Illicit P2P Trading | MEDIUM | 43.89 |
| `SRC` | Sanction Risk Country | MEDIUM | 43.19 |
| `CM` | Coin Mixer | MEDIUM | 42 |
| `PCR` | Privacy Crime | MEDIUM | 40 |
| `OKUV` | Overseas Unverified Exchange | MEDIUM | 40 |
| `KUV` | Domestic Unverified Exchange | MEDIUM | 40 |
| `OT` | Other Threats | LOW | 30.5 |
| `UR` | Unidentified Risk | LOW | 30.5 |

### RA Model Structure

```
ra_code3 (Entity Name)     e.g., Lazarus, Upbit
    ↓ Dictionary auto-mapping
ra_code2 (Risk/Type)       e.g., DIS, DCE
    ↓ Classification table
ra_code1 (Top Category)    e.g., BL (Blacklist), CE (Centralized Exchange)
```

### Tracking Analysis (hop_count)

| risk_analysis_type | hop_count | Meaning |
|--------------------|-----------|---------|
| `Direct` | 0 | Address is directly risky |
| `Tracked` | 1 | 1-hop trace (direct transaction with risky address) |
| `Tracked` | 2 | 2-hop trace |
| `Tracked` | 3 | 3-hop trace |

### KYT Response

```json
{
  "decision": "BLOCK",
  "riskScore": 100,
  "raCode1": "BL",
  "raCode2": "DIS",
  "raCode3": "Lazarus",
  "riskAnalysisType": "Direct",
  "hopCount": 0,
  "blockReason": "Blocked by ra_code2 registry: DIS (Lazarus), Direct, hop 0",
  "provider": "transight-kyt"
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `KYT_API_BASE_URL` | ✅ | — | TranSight KYT API URL |
| `KYT_API_KEY` | ✅ | — | KYT API key |
| `KYT_BLOCK_THRESHOLD` | ⬜ | `80` | riskScore BLOCK threshold |
| `KYT_WARN_THRESHOLD` | ⬜ | `50` | WARN threshold |
| `KYT_TIMEOUT_MS` | ⬜ | `5000` | Timeout (ms) |
| `KYT_DISABLED` | ⬜ | `false` | Disable KYT globally (testing) |

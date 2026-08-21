# Authentication

Bonanza TTR can combine API credentials, request signing, mTLS, VPN/IPsec, and dedicated lines depending on the channel.

## HTTP Authentication

```http
Authorization: Bearer <BONANZA_TTR_API_KEY>
```

Financial-institution IDC channels can add network access controls, institution certificates, IP allowlists, and dedicated connectivity.

## CodeVASP-Compatible Headers

| Header | Description |
| --- | --- |
| `X-Code-Req-Datetime` | ISO8601 UTC datetime |
| `X-Code-Req-Nonce` | Replay-prevention nonce |
| `X-Code-Req-PubKey` | Sender Ed25519 public key |
| `X-Code-Req-Remote-PubKey` | Receiver Ed25519 public key |
| `X-Code-Req-Signature` | Ed25519 detached signature |
| `X-Request-Origin` | `{allianceName}:{vaspEntityId}`. Example: `bonanza:bank-a` |

## Signature Data

```text
SignatureData =
  UTF8(X-Code-Req-Datetime)
  + UTF8(JSON request body)
  + BigEndian4Bytes(nonce)

Signature = Ed25519.sign(SignatureData, senderPrivateKey)
```

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `BONANZA_HUB_VASP_ENTITY_ID` | Hub VASP id for outbound relay |
| `BONANZA_ALLIANCE_PREFIX` | `X-Request-Origin` prefix. Default `bonanza` |
| `BONANZA_SIGNING_PRIVATE_KEY` | Ed25519 signing private key |
| `BONANZA_SIGNING_PUBLIC_KEY` | Ed25519 public key |
| `BONANZA_TTR_CALLBACK_BASE_URL` | Async callback base URL |

Legacy aliases are still recognized for migration: `TRANSIGHT_VASP_ENTITY_ID`, `CODE_API_PRIVATE_KEY`, and `CODE_API_PUBLIC_KEY`.

# 인증과 서명

TravelSafer API는 채널에 따라 API credential, request signing, mTLS, VPN/IPsec, 전용회선을 조합합니다.

## HTTP Authentication

```http
Authorization: Bearer <TRAVELSAFER_API_KEY>
```

금융기관 IDC 채널은 네트워크 접근제어, 기관 인증서, IP allowlist, 전용성 회선을 함께 적용할 수 있습니다.

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
| `TRAVELSAFER_HUB_VASP_ENTITY_ID` | Hub VASP id for outbound relay |
| `BONANZA_ALLIANCE_PREFIX` | `X-Request-Origin` prefix. Default `bonanza` |
| `BONANZA_SIGNING_PRIVATE_KEY` | Ed25519 signing private key |
| `BONANZA_SIGNING_PUBLIC_KEY` | Ed25519 public key |
| `TRAVELSAFER_CALLBACK_BASE_URL` | Async callback base URL |

Legacy aliases are still recognized for migration: `TRANSIGHT_VASP_ENTITY_ID`, `CODE_API_PRIVATE_KEY`, and `CODE_API_PUBLIC_KEY`.

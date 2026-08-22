# @bonanza/ttr-sdk

TravelSafer client SDK and onboarding CLI for Travel Rule integrations.

## Install

```bash
npm install @bonanza/ttr-sdk
npx travelsafer init --vasp-id your-vasp-id --base-url https://api.transight.io/v1
```

The init command writes:

- `travelsafer.config.json`
- `.env.travelsafer.example`
- `travelsafer.example.ts`

## Client

```ts
import { TravelSaferClient, encryptPayload } from '@bonanza/ttr-sdk';

const client = new TravelSaferClient({
  baseUrl: 'https://api.transight.io/v1',
  apiKey: process.env.TRAVELSAFER_API_KEY,
  vaspEntityId: 'my-vasp',
  signingPrivateKey: process.env.TRAVELSAFER_PRIVATE_KEY,
});

const beneficiary = await client.getPublicKey('beneficiary-vasp');
const beneficiaryKey = beneficiary.keys[0]?.pubkey;

const payload = await encryptPayload(
  { ivms101: { /* ... */ } },
  process.env.TRAVELSAFER_PRIVATE_KEY!,
  beneficiaryKey
);

await client.createTransfer({
  transferId: crypto.randomUUID(),
  currency: 'BTC',
  amount: '0.01',
  address: 'bc1q...',
  originatorVaspEntityId: 'my-vasp',
  beneficiaryVaspEntityId: 'beneficiary-vasp',
  payload,
});
```

## CLI

```bash
travelsafer init --vasp-id my-vasp --base-url https://api.transight.io/v1
travelsafer health --config travelsafer.config.json
travelsafer pubkey beneficiary-vasp --config travelsafer.config.json
```

`bonanza-ttr` and `BonanzaTtrClient` remain available as backward-compatible aliases.

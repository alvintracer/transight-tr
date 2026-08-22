# @bonanza/ttr-sdk

Bonanza TTR client SDK and onboarding CLI for CodeVASP-compatible Travel Rule integrations.

## Install

```bash
npm install @bonanza/ttr-sdk
npx bonanza-ttr init --vasp-id your-vasp-id --base-url https://api.transight.io/v1
```

The init command writes:

- `bonanza-ttr.config.json`
- `.env.bonanza-ttr.example`
- `bonanza-ttr.example.ts`

## Client

```ts
import { BonanzaTtrClient, encryptPayload } from '@bonanza/ttr-sdk';

const client = new BonanzaTtrClient({
  baseUrl: 'https://api.transight.io/v1',
  apiKey: process.env.BONANZA_TTR_API_KEY,
  vaspEntityId: 'my-vasp',
  signingPrivateKey: process.env.BONANZA_TTR_PRIVATE_KEY,
});

const beneficiary = await client.getPublicKey('beneficiary-vasp');
const beneficiaryKey = beneficiary.keys[0]?.pubkey;

const payload = await encryptPayload(
  { ivms101: { /* ... */ } },
  process.env.BONANZA_TTR_PRIVATE_KEY!,
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
bonanza-ttr init --vasp-id my-vasp --base-url https://api.transight.io/v1
bonanza-ttr health --config bonanza-ttr.config.json
bonanza-ttr pubkey beneficiary-vasp --config bonanza-ttr.config.json
```

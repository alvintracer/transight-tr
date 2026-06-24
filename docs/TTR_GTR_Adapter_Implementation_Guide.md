# TTR GTR Adapter Implementation Guide

**Document purpose**: This guide instructs the TTR building agent how to add a Global Travel Rule (GTR) Adapter to the existing TranSight Travel Rule (TTR) API architecture.

**Target system**: TranSight Travel Rule Hub (TTR)

**Primary goal**: Add GTR PII Verification support without changing the public integration surface for domestic financial institutions and exchanges.

---

## 1. Executive Summary

TTR should integrate GTR as a new `ProtocolAdapter`, not as a separate public API product.

Existing clients should continue using:

```http
POST /transfer-auth
```

The TTR Hub should route the request to `GtrAdapter` when the beneficiary VASP has:

```text
alliance_name = 'gtr'
```

The GTR Adapter must preserve the current TTR design principles:

1. KYT Atomic Gate runs before any Travel Rule or PII-related transmission.
2. If KYT blocks the transfer, no PII or encrypted PII payload is sent to GTR.
3. TTR Hub should not decrypt, store, or log PII plaintext by default.
4. GTR should be treated as one external rail among multiple rails: CODE, VerifyVASP, Direct, Transight Internal, GTR, and future Notabene/OON adapters.

Recommended product positioning:

```text
TTR = Domestic financial institution-friendly TR Gateway
GTR = External global PII Verification / Travel Rule rail
```

---

## 2. Existing TTR Assumptions

The current TTR API already has a good foundation for GTR Adapter integration:

- API Gateway: Supabase Edge Functions / Deno
- Database: PostgreSQL / Supabase
- Security: HTTPS + mTLS for financial institutions, Ed25519 signatures for exchanges
- Payload model: encrypted IVMS101 payload
- Adapter pattern: `ProtocolAdapter` selected by `vasps.alliance_name`
- KYT Gate: atomic pre-authorization risk screen
- Transfer state machine: `wait`, `verified`, `denied`, `pending`, `processing`, `wait-confirmed`, `confirmed`, `canceled`

Current Adapter list should be expanded from:

```text
CodeVaspAdapter
VerifyVaspAdapter
DirectAdapter
TransightInternalAdapter
```

to:

```text
CodeVaspAdapter
VerifyVaspAdapter
DirectAdapter
TransightInternalAdapter
GtrAdapter
```

---

## 3. Product Scope

### 3.1 In Scope — Phase 1

Implement GTR PII Verification for outbound transfers.

Primary use case:

```text
Domestic financial institution / domestic VASP
→ TTR Hub
→ GTR Adapter
→ Binance / Bybit / Bitget / OKX / Gate.io / other GTR VASP
```

Supported mode:

```text
Pre-transaction PII Verification
```

Primary policy:

```text
Same-person / account-owner verification
```

Default verify fields:

```text
Natural Person:
- Beneficiary Natural Person Name
- Beneficiary Date of Birth

Legal Person:
- Beneficiary Legal Person Name
- Beneficiary Country of Registration
```

### 3.2 Out of Scope — Phase 1

Do not implement the following in Phase 1 unless explicitly requested:

```text
- GTR Receiver role
- TTR-side fuzzy PII matching
- PII plaintext re-encryption mode as default
- Wallet ownership proof flow
- Out-of-Network email/download link flow
- Full IVMS101 Travel Rule message exchange beyond PII Verification
- Notabene Adapter
- Sumsub Adapter
```

These should be treated as Phase 2 or Phase 3 work.

---

## 4. Critical Design Principle: PII Non-Disclosure

TTR must follow a PII non-disclosure architecture by default.

### 4.1 Default Mode: Client-side GTR Encryption

The sender, usually a financial institution or VASP, should generate IVMS101 internally and encrypt it according to GTR-compatible encryption rules before sending it to TTR.

```text
Financial Institution Internal Network
→ Generate IVMS101
→ Encrypt PII payload using GTR target VASP key / agreed GTR encryption method
→ Send encrypted payload to TTR
→ TTR routes encrypted payload to GTR
```

TTR should only see:

```text
- transferId
- asset/currency
- amount
- network
- destination address
- beneficiary VASP ID
- target GTR VASP code
- encrypted payload
- KYT result
- GTR verification result
```

TTR should not see:

```text
- originator name
- beneficiary name
- date of birth
- national ID
- customer ID
- address
- place of birth
- any other PII plaintext
```

### 4.2 Restricted Mode: TTR Re-encryption

TTR-side decryption and re-encryption is not allowed by default.

It may be implemented later only if all of the following conditions are met:

```text
- Client contract explicitly allows it
- Security review approves it
- PII plaintext is processed only in memory
- No PII plaintext is logged
- KMS/HSM/enclave or equivalent control is used
- Audit log records that re-encryption was performed
- Re-encryption mode is disabled by default
```

---

## 5. Database Changes

## 5.1 Extend `vasps.alliance_name`

Allow the following value:

```text
gtr
```

Current query support should be updated to allow:

```http
GET /vasp-registry?alliance={code|verifyvasp|transight|sumsub|direct|gtr}
```

---

## 5.2 New Table: `gtr_vasp_profiles`

Create a dedicated GTR VASP profile table.

```sql
CREATE TABLE gtr_vasp_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vasp_id UUID NOT NULL REFERENCES vasps(id) ON DELETE CASCADE,

  gtr_vasp_code TEXT NOT NULL,
  gtr_legal_entity_name TEXT,
  gtr_display_name TEXT,
  jurisdiction TEXT,

  target_public_key TEXT,
  target_public_key_algorithm TEXT DEFAULT 'curve25519',
  target_public_key_expires_at TIMESTAMPTZ,

  support_pre_transaction BOOLEAN DEFAULT true,
  support_post_transaction BOOLEAN DEFAULT false,

  pii_verification_support TEXT[] DEFAULT '{}',
  expected_pii_preferences TEXT[] DEFAULT '{}',

  address_verification_supported BOOLEAN DEFAULT false,
  txid_verification_supported BOOLEAN DEFAULT false,

  status TEXT NOT NULL DEFAULT 'active',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(gtr_vasp_code)
);
```

### Required operating data

For each GTR VASP, store:

```text
- Internal TTR VASP ID
- GTR VASP code
- Legal entity name
- Jurisdiction
- Public key / encryption key
- Supported verification direction
- Supported PII verification fields
- Expected PII preferences
- Address verification support
- TXID verification support
- Active / pending / disabled status
```

---

## 5.3 New Table: `gtr_transfer_logs`

Create a GTR-specific transfer log table.

```sql
CREATE TABLE gtr_transfer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,

  gtr_request_id TEXT NOT NULL,
  gtr_travelrule_id TEXT,
  target_vasp_code TEXT NOT NULL,

  verify_direction INTEGER,
  verify_status INTEGER,
  verify_message TEXT,
  verify_fields JSONB DEFAULT '[]',

  request_payload_hash TEXT,
  response_payload_hash TEXT,

  latency_ms INTEGER,
  http_status INTEGER,
  error_code TEXT,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Logging rule

Do not store raw request/response bodies if they may contain encrypted payloads or PII-adjacent data.

Allowed:

```text
- payload hash
- requestId
- transferId
- targetVaspCode
- verifyStatus
- verifyFields
- latency
- error code
```

Forbidden:

```text
- IVMS101 plaintext
- names
- DOB
- national ID
- full encrypted payload in multiple places
- full GTR request body in logs
```

---

## 6. API Changes

## 6.1 Public API: Keep `/transfer-auth`

Do not create a new public GTR endpoint.

Keep:

```http
POST /transfer-auth
```

---

## 6.2 Extend `/transfer-auth` Request

Add optional `adapterOptions.gtr`.

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "currency": "ETH",
  "amount": "1.25",
  "tradePrice": "4500000",
  "tradeCurrency": "KRW",
  "isExceedingThreshold": true,
  "payload": "Base64EncodedGtrEncryptedIVMS101==",
  "address": "0x339facb1153e01d1e0d21e378da56d851da25ade",
  "tag": "",
  "network": "ETH",
  "beneficiaryVaspEntityId": "binance",
  "originatorVaspEntityId": "hana-bank",
  "adapterOptions": {
    "gtr": {
      "mode": "PII_VERIFICATION",
      "verifyDirection": 2,
      "targetVaspCode": "BINANCE_GTR_CODE",
      "initiatorPublicKey": "BANK_OR_TTR_CURVE25519_PUBLIC_KEY",
      "targetVaspPublicKey": "TARGET_VASP_CURVE25519_PUBLIC_KEY",
      "expectVerifyFields": ["110026", "110025"],
      "payloadFormat": "GTR_CURVE25519_ENCRYPTED",
      "lawThresholdEnabled": true
    }
  }
}
```

### Field notes

| Field | Description |
|---|---|
| `adapterOptions.gtr.mode` | Use `PII_VERIFICATION` for Phase 1 |
| `verifyDirection` | Use GTR-defined direction code. Default to pre-transaction outbound |
| `targetVaspCode` | GTR VASP code. If absent, load from `gtr_vasp_profiles` |
| `initiatorPublicKey` | Sender/TTR public key for GTR encryption flow |
| `targetVaspPublicKey` | Target VASP public key |
| `expectVerifyFields` | PII fields to verify |
| `payloadFormat` | Indicates that `payload` is already GTR-compatible encrypted payload |
| `lawThresholdEnabled` | Use `isExceedingThreshold` as default |

---

## 6.3 Extend `/transfer-auth` Response

Add GTR metadata inside `adapter`.

```json
{
  "result": "verified",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "beneficiaryVasp": {
    "vaspEntityId": "binance",
    "vaspName": "Binance"
  },
  "payload": "Base64EncodedResponsePayload==",
  "kyt": {
    "decision": "pass",
    "riskScore": 12
  },
  "adapter": {
    "protocol": "gtr",
    "latencyMs": 812,
    "gtr": {
      "requestId": "TTR-550e8400-e29b-41d4-a716-446655440000",
      "travelruleId": "GTR-TRAVELRULE-ID",
      "targetVaspCode": "BINANCE_GTR_CODE",
      "verifyStatus": 100000,
      "verifyMessage": "Verification Success",
      "verifyFields": [
        {
          "type": "110026",
          "status": 1,
          "message": "matched"
        },
        {
          "type": "110025",
          "status": 1,
          "message": "date of birth matched"
        }
      ]
    }
  }
}
```

---

## 7. GTR Request Mapping

Map TTR fields to GTR one-step verification fields.

| TTR Field | GTR Field | Notes |
|---|---|---|
| `transferId` | `requestId` | Use `TTR-{transferId}` |
| `currency` | `ticker` | Example: BTC, ETH, USDT |
| `amount` | `amount` | Crypto amount |
| `tradeCurrency` | `fiatName` | Example: KRW |
| `tradePrice` | `fiatPrice` | Fiat equivalent amount |
| `address` | `address` | Beneficiary wallet address |
| `tag` | `tag` | Memo/tag for XRP/XLM/TON etc. |
| `network` | `network` | Chain/network |
| `payload` | `encryptedPayload` | GTR-compatible encrypted payload |
| `beneficiaryVaspEntityId` | `targetVaspCode` | Via `gtr_vasp_profiles` |
| `isExceedingThreshold` | `lawThresholdEnabled` | Use as default |
| `adapterOptions.gtr.expectVerifyFields` | `expectVerifyFields` | Verification fields |
| `txid` | `txId` | For post-transaction flow |

---

## 8. Default Verify Fields

## 8.1 Natural Person

Default same-person verification:

```json
{
  "expectVerifyFields": [
    "110026",
    "110025"
  ]
}
```

Meaning:

```text
110026 = Beneficiary Natural Person Name
110025 = Beneficiary Natural Person Date of Birth
```

## 8.2 Legal Person

Default legal-person verification:

```json
{
  "expectVerifyFields": [
    "111001",
    "111022"
  ]
}
```

Meaning:

```text
111001 = Beneficiary Legal Person Name
111022 = Beneficiary Legal Person Country Of Registration
```

## 8.3 Important Operating Rule

Do not assume that Binance, Bybit, Bitget, OKX, or any other GTR VASP supports all requested fields.

Each VASP may have different:

```text
- PII Verification Support
- Expected PII Preferences
- Direction support
- Address verification support
- Legal-person support
```

Therefore, always check `gtr_vasp_profiles` before sending the request.

---

## 9. Adapter Selection

Update `selectAdapter`.

```ts
function selectAdapter(allianceName: string): ProtocolAdapter {
  switch (allianceName) {
    case 'code':       return new CodeVaspAdapter();
    case 'verifyvasp': return new VerifyVaspAdapter();
    case 'direct':     return new DirectAdapter();
    case 'transight':  return new TransightInternalAdapter();
    case 'gtr':        return new GtrAdapter();
    default:           return new DirectAdapter();
  }
}
```

---

## 10. GtrAdapter Interface

Use the existing adapter response interface.

```ts
interface AdapterResponse {
  result: 'verified' | 'denied' | 'pending';
  reasonType?: string;
  reasonMsg?: string;
  payload?: string;
  protocol: string;
  latencyMs: number;
  beneficiaryVasp?: object;
}
```

Implement:

```ts
export class GtrAdapter implements ProtocolAdapter {
  constructor(
    private readonly gtrClient: GtrClient,
    private readonly vaspRegistry: VaspRegistryRepository,
    private readonly transferLogRepo: GtrTransferLogRepository
  ) {}

  async authorizeTransfer(ctx: TransferAuthContext): Promise<AdapterResponse> {
    const started = Date.now();

    const gtrProfile = await this.vaspRegistry.getGtrProfile(
      ctx.beneficiaryVaspEntityId
    );

    if (!gtrProfile || gtrProfile.status !== 'active') {
      return {
        result: 'denied',
        reasonType: 'VASP_NOT_FOUND',
        reasonMsg: 'GTR target VASP profile not found or inactive',
        protocol: 'gtr',
        latencyMs: Date.now() - started
      };
    }

    this.validateGtrOptions(ctx, gtrProfile);

    const request = this.buildOneStepRequest(ctx, gtrProfile);

    try {
      const response = await this.gtrClient.submitOneStep(request);

      await this.transferLogRepo.insert({
        transferId: ctx.transferDbId,
        gtrRequestId: request.requestId,
        gtrTravelruleId: response.data?.travelruleId,
        targetVaspCode: request.targetVaspCode,
        verifyDirection: request.verifyDirection,
        verifyStatus: response.verifyStatus,
        verifyMessage: response.verifyMessage,
        verifyFields: response.data?.verifyFields ?? [],
        requestPayloadHash: sha256Safe(request.encryptedPayload),
        responsePayloadHash: sha256Safe(response.data?.encryptedPayload),
        latencyMs: Date.now() - started,
        httpStatus: 200
      });

      return {
        ...mapGtrToTtrStatus(response),
        protocol: 'gtr',
        latencyMs: Date.now() - started,
        beneficiaryVasp: {
          vaspEntityId: ctx.beneficiaryVaspEntityId,
          vaspName: ctx.beneficiaryVasp?.vaspName,
          gtrVaspCode: gtrProfile.gtr_vasp_code
        }
      };
    } catch (e) {
      await this.transferLogRepo.insertError({
        transferId: ctx.transferDbId,
        gtrRequestId: request.requestId,
        targetVaspCode: request.targetVaspCode,
        errorCode: normalizeGtrErrorCode(e),
        errorMessage: safeErrorMessage(e),
        latencyMs: Date.now() - started
      });

      return {
        result: 'pending',
        reasonType: 'CHANNEL_TIMEOUT',
        reasonMsg: 'GTR adapter failed or timed out',
        protocol: 'gtr',
        latencyMs: Date.now() - started
      };
    }
  }
}
```

---

## 11. Build GTR Request

```ts
function buildOneStepRequest(
  ctx: TransferAuthContext,
  gtrProfile: GtrVaspProfile
): GtrOneStepRequest {
  const gtr = ctx.adapterOptions?.gtr ?? {};

  return {
    requestId: `TTR-${ctx.transferId}`,
    ticker: ctx.currency,
    amount: ctx.amount,
    address: ctx.address,
    tag: ctx.tag ?? '',
    network: ctx.network,
    txId: ctx.txid ?? null,

    verifyDirection: gtr.verifyDirection ?? 2,
    targetVaspCode: gtr.targetVaspCode ?? gtrProfile.gtr_vasp_code,

    encryptedPayload: ctx.payload,

    initiatorPublicKey: gtr.initiatorPublicKey ?? process.env.GTR_PUBLIC_KEY,
    targetVaspPublicKey: gtr.targetVaspPublicKey ?? gtrProfile.target_public_key,

    fiatName: ctx.tradeCurrency ?? 'KRW',
    fiatPrice: ctx.tradePrice ?? null,

    lawThresholdEnabled: ctx.isExceedingThreshold ?? false,

    expectVerifyFields:
      gtr.expectVerifyFields ??
      defaultExpectVerifyFields(ctx.customerType),

    piiSecuredInfo: gtr.piiSecuredInfo ?? undefined
  };
}
```

---

## 12. GTR Response Mapping

Map GTR response into TTR `AdapterResponse`.

### 12.1 Basic mapping

```ts
function mapGtrToTtrStatus(gtrResponse): AdapterResponse {
  if (!gtrResponse.success) {
    return {
      result: 'pending',
      reasonType: 'GTR_SERVICE_ERROR',
      reasonMsg: gtrResponse.verifyMessage ?? 'GTR request failed',
      protocol: 'gtr',
      latencyMs: 0
    };
  }

  const fields = gtrResponse.data?.verifyFields ?? [];

  const hasMismatch = fields.some(f => f.status === 2);
  if (hasMismatch) {
    return {
      result: 'denied',
      reasonType: mapMismatchReason(fields),
      reasonMsg: 'GTR PII verification mismatch',
      payload: gtrResponse.data?.encryptedPayload,
      protocol: 'gtr',
      latencyMs: 0
    };
  }

  const hasRequiredMissing = fields.some(f => f.status === 4);
  if (hasRequiredMissing) {
    return {
      result: 'denied',
      reasonType: 'LACK_OF_INFORMATION',
      reasonMsg: 'Required PII field missing for GTR verification',
      payload: gtrResponse.data?.encryptedPayload,
      protocol: 'gtr',
      latencyMs: 0
    };
  }

  const hasNotSupport = fields.some(f => f.status === 3);
  if (hasNotSupport) {
    return {
      result: 'pending',
      reasonType: 'GTR_FIELD_NOT_SUPPORTED',
      reasonMsg: 'Counterparty VASP does not support one or more requested verify fields',
      payload: gtrResponse.data?.encryptedPayload,
      protocol: 'gtr',
      latencyMs: 0
    };
  }

  return {
    result: 'verified',
    payload: gtrResponse.data?.encryptedPayload,
    protocol: 'gtr',
    latencyMs: 0
  };
}
```

### 12.2 Reason code mapping

| GTR result | TTR reasonType |
|---|---|
| Name mismatch | `INPUT_NAME_MISMATCHED` |
| DOB mismatch | `DOB_MISMATCHED` |
| Required field missing | `LACK_OF_INFORMATION` |
| Field not supported | `GTR_FIELD_NOT_SUPPORTED` |
| Timeout | `CHANNEL_TIMEOUT` |
| API routing failure | `CHANNEL_ROUTING_FAILED` |
| Target VASP inactive | `VASP_HEALTH_DOWN` |
| Target key expired/missing | `VASP_KEY_EXPIRED` |
| Unknown | `UNKNOWN` |

---

## 13. GTR Client

Implement a small client wrapper.

```ts
export class GtrClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly mtlsAgent?: unknown
  ) {}

  async submitOneStep(req: GtrOneStepRequest): Promise<GtrOneStepResponse> {
    const res = await fetch(`${this.baseUrl}/api/verify/v2/one_step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey
      },
      body: JSON.stringify(req)
    });

    if (!res.ok) {
      throw new GtrHttpError(res.status, await res.text());
    }

    return await res.json();
  }
}
```

## 13.1 Important mTLS Deployment Note

TTR currently uses Supabase Edge Functions.

Before implementing production GTR calls inside Edge Functions, verify whether outbound client certificate mTLS is supported in the target runtime.

If outbound mTLS is not supported or is operationally weak, use this architecture:

```text
Supabase Edge Function
→ Internal Private GTR Adapter Service
→ mTLS outbound
→ GTR
```

Recommended implementation for the private adapter service:

```text
Node.js / Java / Go service
Private network only
mTLS cert mounted via secret manager
No public ingress except from TTR Edge Function
```

---

## 14. Operating Policy

## 14.1 Routing priority

Suggested routing order:

```text
1. Bybit Direct Adapter
   - Use when Bybit-specific Korea flow, RFI, Freeze, IAAN, or partner-specific handling is required.

2. GTR Adapter
   - Use for Binance, Bybit, Bitget, OKX, Gate.io, BingX, and other GTR-supported VASPs for standard PII Verification.

3. CODE / VerifyVASP
   - Use for domestic or alliance-specific VASPs.

4. Direct Adapter
   - Use for bilateral integrations.

5. OON / Manual flow
   - Use only when no supported rail exists.
```

## 14.2 GTR VASP Profile Management

Admin console should allow compliance/ops users to manage:

```text
- GTR VASP code
- VASP legal entity
- Jurisdiction
- Public key
- Key expiry
- Supported verify direction
- Supported PII fields
- Expected PII fields
- Address verification support
- Current health/status
- Last test result
- Last sync time
```

Do not hardcode Binance/Bybit/Bitget settings in source code.

---

## 15. Error Handling

### 15.1 Fail-open vs fail-closed

Default policy for regulated financial clients:

```text
GTR verification failure = pending or denied, not verified
```

Recommended mapping:

| Situation | TTR result |
|---|---|
| All required fields matched | `verified` |
| Name or DOB mismatch | `denied` |
| Required field missing | `denied` |
| Target VASP does not support field | `pending` |
| GTR timeout | `pending` |
| GTR service down | `pending` |
| Target VASP disabled | `denied` or `pending` depending client policy |
| KYT block | `denied` |

### 15.2 Timeout

Recommended timeout:

```text
Synchronous request timeout: 10 seconds
```

If exceeded:

```json
{
  "result": "pending",
  "reasonType": "CHANNEL_TIMEOUT",
  "reasonMsg": "GTR verification timed out"
}
```

---

## 16. Security Requirements

## 16.1 Never log PII

Search all logs for PII leakage.

Forbidden strings include:

```text
name
dateOfBirth
dob
nationalIdentifier
customerIdentification
residentRegistrationNumber
passport
addressLine
placeOfBirth
```

## 16.2 Store only metadata and hashes

Allowed fields:

```text
transferId
requestId
targetVaspCode
verifyStatus
verifyFields
payloadHash
latency
errorCode
```

## 16.3 KYT-before-GTR enforcement

Add a test ensuring that when KYT result is `block`, `GtrClient.submitOneStep()` is never called.

---

## 17. Test Plan

## 17.1 Unit Tests

```text
1. alliance_name='gtr' selects GtrAdapter.
2. transferId maps to requestId='TTR-{transferId}'.
3. currency maps to ticker.
4. tradeCurrency/tradePrice map to fiatName/fiatPrice.
5. payload maps to encryptedPayload.
6. beneficiaryVaspEntityId maps to gtr_vasp_profiles.gtr_vasp_code.
7. default natural person fields are ['110026', '110025'].
8. GTR all-match response maps to TTR verified.
9. GTR field mismatch maps to TTR denied.
10. GTR required missing maps to LACK_OF_INFORMATION.
11. GTR field unsupported maps to pending / GTR_FIELD_NOT_SUPPORTED.
12. GTR timeout maps to pending / CHANNEL_TIMEOUT.
13. KYT block prevents GTR invocation.
```

## 17.2 Integration Tests

```text
1. Register Binance as alliance_name='gtr'.
2. Insert Binance GTR profile.
3. Call /transfer-auth with GTR adapterOptions.
4. Confirm GtrAdapter is called.
5. Confirm gtr_transfer_logs row is inserted.
6. Confirm transfers.status becomes verified/denied/pending based on mocked GTR response.
7. Call /transfer-auth/result after verified.
8. Confirm status becomes confirmed.
```

## 17.3 Security Tests

```text
1. Confirm no PII plaintext in audit_log.
2. Confirm no PII plaintext in application logs.
3. Confirm no raw request body logging for GTR calls.
4. Confirm payload hash is stored.
5. Confirm target public key expiration results in VASP_KEY_EXPIRED.
6. Confirm GTR API key is never returned in error messages.
7. Confirm mTLS certificate failure returns CHANNEL_ROUTING_FAILED or CHANNEL_TIMEOUT.
```

---

## 18. Implementation Milestones

## Milestone 1 — Schema and Registry

```text
- Add 'gtr' as alliance_name.
- Create gtr_vasp_profiles.
- Create gtr_transfer_logs.
- Update /vasp-registry response to include metadata.gtr.
```

## Milestone 2 — Adapter Skeleton

```text
- Add GtrAdapter class.
- Add adapter selection logic.
- Add GtrClient.
- Add request builder.
- Add response mapper.
```

## Milestone 3 — Transfer Auth Integration

```text
- Extend /transfer-auth request parser with adapterOptions.gtr.
- Validate GTR profile.
- Run KYT Gate before GTR.
- Route to GtrAdapter.
- Store transfer and GTR log.
- Return normalized response.
```

## Milestone 4 — Security and Logging

```text
- Remove raw body logs.
- Add payload hashing.
- Add PII leakage tests.
- Add KYT-before-GTR test.
```

## Milestone 5 — mTLS / Deployment PoC

```text
- Test outbound mTLS from Supabase Edge Functions.
- If unsupported, deploy private GTR Adapter Service.
- Wire Edge Function to private service.
```

## Milestone 6 — Sandbox Testing

```text
- Register sandbox GTR VASP profile.
- Test success/mismatch/missing/unsupported/timeout cases.
- Confirm status transitions.
```

---

## 19. Final Architecture

```text
Domestic Financial Institution / VASP
        |
        | HTTPS + mTLS / VPN / Leased Line
        v
TTR /transfer-auth
        |
        | 1. Signature verification
        | 2. VASP registry lookup
        | 3. KYT Atomic Gate
        | 4. Transfer record creation
        | 5. Adapter selection
        v
GtrAdapter
        |
        | 1. Load GTR VASP profile
        | 2. Build one_step request
        | 3. Submit encrypted payload
        | 4. Normalize result
        | 5. Store GTR log
        v
GTR Network
        |
        v
Target VASP: Binance / Bybit / Bitget / OKX / Gate.io / etc.
```

---

## 20. Key Product Message

Use this product explanation externally:

```text
TTR allows domestic financial institutions to connect only to a domestic, regulated-friendly TR Gateway while TTR routes encrypted Travel Rule or PII Verification payloads to external rails such as GTR. PII is generated and encrypted inside the financial institution or sending VASP environment. TTR processes only encrypted payloads, transaction metadata, KYT results, VASP routing data, and verification results.
```

---

## 21. Developer Warning

Do not implement GTR by decrypting TTR `payload` inside the Hub and rebuilding PII plaintext unless a separate re-encryption mode has been formally approved.

Default assumption:

```text
payload is already GTR-compatible encryptedPayload when alliance_name='gtr'.
```

If future support is needed for non-GTR TTR NaCl payload re-encryption, implement it as a separate explicitly named mode:

```text
adapterOptions.gtr.mode = 'REENCRYPT_TO_GTR'
```

and keep it disabled by default.


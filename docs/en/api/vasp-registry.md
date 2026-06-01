# VASP Registry

Register and query Virtual Asset Service Providers (VASPs).

## List VASPs

Returns a list of all registered VASPs.

### Request

```http
GET /vasp-registry
```

### Response — 200 OK

```json
{
  "vasps": [
    {
      "vaspEntityId": "test-exchange-a",
      "vaspName": "Test Exchange A",
      "vaspLegalName": "Test Exchange A Inc.",
      "countryOfRegistration": "KR",
      "allianceName": "code",
      "health": "up",
      "pubkeys": [
        {
          "pubkey": "dGVzdC1wdWJsaWMta2V5...",
          "expiresAt": null
        }
      ]
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `vaspEntityId` | `string` | Unique VASP identifier |
| `vaspName` | `string` | Display name |
| `vaspLegalName` | `string` | Legal registered name |
| `countryOfRegistration` | `string` | Registration country (ISO 3166-1 alpha-2) |
| `allianceName` | `string` | Alliance (`code`, `verifyvasp`, `transight`, `direct`) |
| `health` | `"up" \| "down"` | Connection status |
| `pubkeys` | `array` | Ed25519 public keys |

---

## Get VASP Details

Returns detailed information for a specific VASP, including public keys.

### Request

```http
GET /vasp-registry?id={vaspEntityId}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | ✅ | VASP Entity ID |

### Response — 200 OK

```json
{
  "id": "uuid-...",
  "vasp_entity_id": "test-exchange-a",
  "vasp_name": "Test Exchange A",
  "vasp_legal_name": "Test Exchange A Inc.",
  "country_of_registration": "KR",
  "alliance_name": "code",
  "channel_type": "HTTPS",
  "health": "up",
  "public_keys": [
    {
      "id": "uuid-...",
      "public_key": "dGVzdC1wdWJsaWMta2V5...",
      "algorithm": "Ed25519",
      "expires_at": null,
      "is_active": true,
      "created_at": "2026-06-01T13:42:03Z"
    }
  ]
}
```

### Response — 404 Not Found

```json
{
  "error": "VASP not found",
  "vaspEntityId": "unknown-vasp"
}
```

---

## Register VASP

Register a new VASP in the TranSight network.

### Request

```http
POST /vasp-registry
Content-Type: application/json
```

### Request Body

```json
{
  "vasp_entity_id": "my-exchange",
  "vasp_name": "My Exchange",
  "vasp_legal_name": "My Exchange Co., Ltd.",
  "country_of_registration": "KR",
  "alliance_name": "transight",
  "endpoint_url": "https://my-exchange.com/tr-api",
  "channel_type": "HTTPS",
  "public_key": "Base64EncodedEd25519PublicKey==",
  "public_key_expires_at": "2027-01-01T00:00:00Z"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vasp_entity_id` | `string` | ✅ | Unique identifier |
| `vasp_name` | `string` | ✅ | Display name |
| `vasp_legal_name` | `string` | ⬜ | Legal registered name |
| `country_of_registration` | `string` | ✅ | ISO 3166-1 alpha-2 |
| `alliance_name` | `string` | ⬜ | Default: `transight` |
| `endpoint_url` | `string` | ✅ | TR API endpoint URL |
| `channel_type` | `string` | ⬜ | `HTTPS` \| `mTLS` \| `VPN` \| `LEASED_LINE` |
| `public_key` | `string` | ✅ | Ed25519 public key (Base64) |
| `public_key_expires_at` | `string` | ⬜ | Key expiration (ISO8601) |

### Response — 201 Created

```json
{
  "success": true,
  "vasp": {
    "id": "uuid-...",
    "vasp_entity_id": "my-exchange",
    "vasp_name": "My Exchange",
    ...
  }
}
```

### Response — 409 Conflict

```json
{
  "error": "VASP entity ID already exists",
  "vasp_entity_id": "my-exchange"
}
```

## Examples

::: code-group

```bash [List VASPs]
curl -H "Authorization: Bearer $ANON_KEY" \
  https://your-project.supabase.co/functions/v1/vasp-registry
```

```bash [Register VASP]
curl -X POST \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "vasp_entity_id": "my-exchange",
    "vasp_name": "My Exchange",
    "country_of_registration": "KR",
    "endpoint_url": "https://my-exchange.com/tr",
    "public_key": "abc123=="
  }' \
  https://your-project.supabase.co/functions/v1/vasp-registry
```

:::

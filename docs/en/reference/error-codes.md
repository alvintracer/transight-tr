# Error Codes

## Transfer Denial Reasons

| Code | Description |
|------|-------------|
| `NOT_FOUND_ADDRESS` | Wallet address not found |
| `NOT_SUPPORTED_SYMBOL` | Unsupported asset |
| `NOT_KYC_USER` | User KYC is incomplete |
| `INPUT_NAME_MISMATCHED` | Beneficiary name mismatch |
| `DOB_MISMATCHED` | Date of birth mismatch |
| `SANCTION_LIST` | Sanctioned entity |
| `LACK_OF_INFORMATION` | Insufficient information |
| `UNKNOWN` | Other reason |

## TravelSafer Errors

### Authentication

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_INVALID_SIGNATURE` | 401 | Request signature verification failed. |
| `AUTH_EXPIRED_NONCE` | 401 | Nonce or timestamp expired. |
| `AUTH_UNKNOWN_VASP` | 401 | Requesting VASP is not registered. |
| `AUTH_KEY_MISMATCH` | 401 | Signing key does not match registry. |

### VASP Registry

| Code | HTTP | Description |
|------|------|-------------|
| `VASP_NOT_FOUND` | 404 | VASP is not registered. |
| `VASP_KEY_NOT_FOUND` | 404 | Active public key does not exist. |
| `VASP_KEY_EXPIRED` | 409 | Public key is expired or inactive. |
| `ADDRESS_VERIFY_REPLACED` | 410 | Legacy address verification was replaced by OwnerCheck. |

### Transfer

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_REQUEST` | 400 | Required field is missing or malformed. |
| `TRANSFER_NOT_FOUND` | 404 | Transfer does not exist. |
| `TRANSFER_DUPLICATE` | 409 | Duplicate transfer id or idempotency key. |
| `TRANSFER_INVALID_STATUS` | 409 | Current status does not allow the requested transition. |
| `ROUTING_FAILED` | 502 | Beneficiary endpoint could not be reached. |

### OwnerCheck

| Code | HTTP | Description |
|------|------|-------------|
| `OWNER_CHECK_NOT_FOUND` | 404 | OwnerCheck request does not exist. |
| `OWNER_CHECK_DUPLICATE` | 409 | Duplicate OwnerCheck id. |
| `OWNER_CHECK_EXPIRED` | 410 | OwnerCheck TTL expired. |
| `OWNER_CHECK_POLICY_MISMATCH` | 422 | Requested matching policy is not supported. |

### KYT

| Code | HTTP | Description |
|------|------|-------------|
| `KYT_BLOCK` | 403 | KYT policy blocked the transfer before relay. |
| `KYT_TIMEOUT` | 504 | KYT provider timed out. |
| `KYT_SERVICE_ERROR` | 502 | KYT provider returned an error. |

### External Adapter Policy

| Code | HTTP | Description |
|------|------|-------------|
| `PROTOCOL_DISABLED` | 403 | GTR, Sumsub, or VerifyVASP adapter is disabled in the core data plane. |

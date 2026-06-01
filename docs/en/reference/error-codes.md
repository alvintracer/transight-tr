# Error Codes

## Transfer Denial Reasons (CODE VASP Compatible)

| Code | Description |
|------|-------------|
| `NOT_FOUND_ADDRESS` | Wallet address not found |
| `NOT_SUPPORTED_SYMBOL` | Unsupported coin symbol |
| `NOT_KYC_USER` | User KYC not completed |
| `INPUT_NAME_MISMATCHED` | Beneficiary name mismatch |
| `DOB_MISMATCHED` | Date of birth mismatch |
| `SANCTION_LIST` | Sanctioned entity |
| `LACK_OF_INFORMATION` | Insufficient information |
| `UNKNOWN` | Other reasons |

## TranSight Extended Error Codes

### Authentication (HTTP 401)
| Code | Description |
|------|-------------|
| `AUTH_INVALID_SIGNATURE` | Signature verification failed |
| `AUTH_EXPIRED_NONCE` | Nonce expired |
| `AUTH_UNKNOWN_VASP` | Unregistered VASP |
| `AUTH_KEY_MISMATCH` | Public key mismatch |

### KYT (HTTP 403)
| Code | Description |
|------|-------------|
| `KYT_BLOCK` | KYT risk detected → PII blocked |
| `KYT_TIMEOUT` | KYT check timeout |

### Transfer (HTTP 400/404/409)
| Code | Description |
|------|-------------|
| `TRANSFER_NOT_FOUND` | Transfer not found |
| `TRANSFER_INVALID_STATUS` | Invalid status transition |
| `TRANSFER_DUPLICATE` | Duplicate transferId |

### IVMS101 (HTTP 400)
| Code | Description |
|------|-------------|
| `IVMS101_INVALID_PAYLOAD` | Invalid payload format |
| `IVMS101_DECRYPTION_FAILED` | Decryption failed |
| `IVMS101_VALIDATION_FAILED` | Schema validation failed |

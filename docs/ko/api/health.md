# Health Check

Bonanza TTR Gateway와 database 연결 상태를 확인합니다.

## Request

```http
GET /health
Authorization: Bearer <BONANZA_TTR_API_KEY>
```

## Response

### 200 OK

```json
{
  "status": "up",
  "timestamp": "2026-08-21T09:00:00.000Z",
  "service": "Bonanza TTR Gateway",
  "version": "0.1.0",
  "components": {
    "database": "up",
    "vasps_registered": 12,
    "active_public_keys": 12
  }
}
```

### 503 Service Unavailable

```json
{
  "status": "down",
  "timestamp": "2026-08-21T09:00:00.000Z",
  "service": "Bonanza TTR Gateway",
  "error": "database unavailable"
}
```

## Field Notes

| Field | Description |
|-------|-------------|
| `status` | Gateway health status. |
| `components.database` | Core metadata database connectivity. |
| `components.vasps_registered` | Registered VASP count. |
| `components.active_public_keys` | Active public key count available for relay. |

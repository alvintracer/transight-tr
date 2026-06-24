# Health Check

Check system status and database connectivity.

## Request

```http
GET /health
```

### Headers

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <API_KEY>` |

## Response

### 200 OK — Healthy

```json
{
  "status": "up",
  "timestamp": "2026-06-01T13:42:49.819Z",
  "service": "TranSight Hub",
  "version": "0.1.0",
  "components": {
    "database": "up",
    "vasps_registered": 4
  }
}
```

### 503 Service Unavailable — Database Error

```json
{
  "status": "down",
  "timestamp": "2026-06-01T13:42:49.819Z",
  "error": "Connection refused"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"up" \| "down"` | Overall system status |
| `timestamp` | `string` | ISO8601 UTC response time |
| `service` | `string` | Service name |
| `version` | `string` | API version |
| `components.database` | `string` | Database connection status |
| `components.vasps_registered` | `number` | Number of registered VASPs |

## Examples

::: code-group

```bash [cURL]
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.transight.io/v1/health
```

```typescript [TypeScript]
const res = await fetch(
  'https://api.transight.io/v1/health',
  { headers: { Authorization: `Bearer ${API_KEY}` } }
);
const data = await res.json();
console.log(data.status); // "up"
```

```python [Python]
import requests

res = requests.get(
    "https://api.transight.io/v1/health",
    headers={"Authorization": f"Bearer {API_KEY}"}
)
print(res.json()["status"])  # "up"
```

:::

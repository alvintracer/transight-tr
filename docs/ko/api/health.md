# Health Check

시스템 상태와 DB 연결을 확인합니다.

## 요청

```http
GET /health
```

### 헤더

| 헤더 | 값 |
|------|-----|
| `Authorization` | `Bearer <ANON_KEY>` |

## 응답

### 200 OK — 정상

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

### 503 Service Unavailable — DB 장애

```json
{
  "status": "down",
  "timestamp": "2026-06-01T13:42:49.819Z",
  "error": "Connection refused"
}
```

## 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `status` | `"up" \| "down"` | 전체 시스템 상태 |
| `timestamp` | `string` | ISO8601 UTC 응답 시각 |
| `service` | `string` | 서비스 이름 |
| `version` | `string` | API 버전 |
| `components.database` | `string` | DB 연결 상태 |
| `components.vasps_registered` | `number` | 등록된 VASP 수 |

## 사용 예시

::: code-group

```bash [cURL]
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
  https://your-project.supabase.co/functions/v1/health
```

```typescript [TypeScript]
const res = await fetch(
  'https://your-project.supabase.co/functions/v1/health',
  { headers: { Authorization: `Bearer ${ANON_KEY}` } }
);
const data = await res.json();
console.log(data.status); // "up"
```

```python [Python]
import requests

res = requests.get(
    "https://your-project.supabase.co/functions/v1/health",
    headers={"Authorization": f"Bearer {ANON_KEY}"}
)
print(res.json()["status"])  # "up"
```

:::

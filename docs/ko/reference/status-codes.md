# Status Codes

자세한 전이는 [State Machine](/ko/guide/state-machine)을 참고합니다.

## Transfer Statuses

| Code | Terminal | Description |
|------|----------|-------------|
| `wait` | No | KYT 또는 수신 VASP 응답 대기 |
| `verified` | No | 수신 VASP 검증 완료 |
| `denied` | Yes | KYT, routing, 수신 VASP 정책상 거절 |
| `pending` | No | 추가 검증 또는 운영 처리 중 |
| `processing` | No | 온체인 전송 처리 중 |
| `wait-confirmed` | No | 기록 이후 finality 대기 |
| `confirmed` | Yes | txHash 보고 완료 |
| `canceled` | Yes | 전송 취소 |

## OwnerCheck Statuses

| Code | Terminal | Description |
|------|----------|-------------|
| `pending` | No | 수신 VASP 응답 대기 |
| `verified` | Yes | 동일 계정주로 확인 |
| `denied` | Yes | 동일 계정주 불일치 또는 거절 |
| `expired` | Yes | TTL 내 응답 없음 |
| `failed` | Yes | routing 또는 시스템 오류 |

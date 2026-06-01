# 상태 머신

Transfer의 라이프사이클은 8단계 상태 머신으로 관리됩니다.

## 상태 다이어그램

```
  ┌──────┐
  │ WAIT │ ← Transfer 생성 시 초기 상태
  └──┬───┘
     │
     ├──────────────┐
     ▼              ▼
┌──────────┐  ┌──────────┐
│ VERIFIED │  │  DENIED  │ ← 최종 상태
└────┬─────┘  └──────────┘
     │
     ▼
┌──────────┐
│ PENDING  │
└────┬─────┘
     │
     ▼
┌────────────┐
│ PROCESSING │ ← 블록체인 전송됨
└────┬───────┘
     │
     ▼
┌────────────────┐
│ WAIT_CONFIRMED │ ← 마이닝 대기
└────┬───────────┘
     │
     ▼
┌───────────┐
│ CONFIRMED │ ← 전송 완료
└───────────┘

* 모든 상태에서 → CANCELED 전이 가능 (블록체인 미실행 시)
```

## 상태 설명

| 상태 | 설명 |
|------|------|
| `wait` | 수신 VASP 응답 대기 중 |
| `verified` | 수신 VASP가 인가함 |
| `denied` | 수신 VASP가 거부함 (최종) |
| `pending` | 블록체인 전송 전 대기 |
| `processing` | 블록체인 전송됨, 마이닝 대기 |
| `wait-confirmed` | 마이닝됨, finality 미확보 |
| `confirmed` | 전송 완료 (TXID 업데이트) |
| `canceled` | 전송 취소 (최종) |

## 허용되는 상태 전이

| 현재 → | 가능한 다음 상태 |
|--------|-----------------|
| `wait` | `verified`, `denied` |
| `verified` | `pending`, `canceled` |
| `denied` | *(최종 상태)* |
| `pending` | `processing`, `canceled` |
| `processing` | `wait-confirmed`, `canceled` |
| `wait-confirmed` | `confirmed`, `canceled` |
| `confirmed` | `canceled` (재조직 등 예외) |
| `canceled` | *(최종 상태)* |

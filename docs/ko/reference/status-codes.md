# 상태 코드

[상태 머신 가이드](/ko/guide/state-machine)의 상세 내용을 참조하세요.

## Transfer 상태

| 상태 | 코드 | 최종 상태 | 설명 |
|------|------|-----------|------|
| 대기 | `wait` | ❌ | 수신 VASP 응답 대기 |
| 인가 | `verified` | ❌ | 수신 VASP 인가 완료 |
| 거부 | `denied` | ✅ | 수신 VASP 거부 |
| 보류 | `pending` | ❌ | 블록체인 전송 전 |
| 처리 중 | `processing` | ❌ | 블록체인 전송됨 |
| 확인 대기 | `wait-confirmed` | ❌ | 마이닝됨, finality 미확보 |
| 확인 완료 | `confirmed` | ❌ | 전송 완료 |
| 취소 | `canceled` | ✅ | 전송 취소 |

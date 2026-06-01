# 빠른 시작

::: warning 🚧 작성 중
이 페이지는 Phase 3 (Transfer Authorization 구현) 완료 후 업데이트됩니다.
:::

## 사전 준비

1. TranSight Hub에 VASP로 등록
2. Ed25519 키쌍 생성
3. API 키 발급

## 5분 안에 첫 TR 전송

```bash
# 1. VASP 등록
curl -X POST .../vasp-registry -d '{...}'

# 2. 수신 VASP 탐색
curl .../vasp-registry

# 3. Transfer Authorization 요청
curl -X POST .../transfer-auth -d '{...}'

# 4. 결과 확인
curl .../transfer-auth?id={transferId}
```

상세 가이드는 [API 개요](/ko/api/overview)를 참조하세요.

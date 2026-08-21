# 소개

Bonanza TTR은 금융기관과 VASP가 디지털 자산 송수신에 필요한 트래블룰 정보를 안전하게 교환하기 위한 게이트웨이입니다.

2026년 8월 기준 제품 방향은 명확합니다. Bonanza TTR은 여러 외부 Travel Rule 네트워크를 모두 직접 adapter로 붙이는 제품이 아니라, CodeVASP 구조를 토대로 한 Bonanza 운영형 공개키 디렉터리와 암호화 relay입니다.

## 핵심 역할

| 역할 | 설명 |
| --- | --- |
| Public Key Directory | 연결 VASP의 Ed25519 공개키, endpoint, channel, capability를 관리합니다. |
| Travel Rule Relay | 송신 기관이 수신 VASP 공개키로 암호화한 IVMS101 payload를 중계합니다. |
| Financial Institution Gateway | 금융기관은 Bonanza IDC, 전용성 회선, mTLS, VPN/IPsec, 구간 암호화로 연동할 수 있습니다. |
| OwnerCheck | 동일 계정주 확인을 별도 API로 제공합니다. |
| KYT Gate | 위험 주소는 Travel Rule payload relay 전에 차단할 수 있습니다. |
| Audit | transfer, owner check, key rotation, routing 결과를 감사 가능한 metadata로 기록합니다. |

## 하지 않는 것

- 수신 VASP가 지정되지 않은 거래를 자동 승인하지 않습니다.
- 수신 VASP의 active public key가 없는 거래를 진행하지 않습니다.
- `pending`을 임의로 `verified`로 바꾸지 않습니다.
- GTR, Sumsub, VerifyVASP 직접 adapter를 core data plane으로 운영하지 않습니다.
- OwnerCheck를 `/v1/code/*` namespace에 넣어 CodeVASP 호환성을 깨지 않습니다.

## 기본 흐름

```text
1. 송신 기관이 수신 VASP public key를 조회합니다.
2. 송신 기관이 IVMS101 payload를 수신 VASP key로 암호화합니다.
3. 송신 기관이 POST /transfer-auth를 호출합니다.
4. Bonanza TTR이 KYT Gate를 수행합니다.
5. block이면 relay하지 않고 denied로 종료합니다.
6. pass/warn이면 수신 VASP endpoint로 암호화 payload를 relay합니다.
7. 결과를 verified / denied / pending으로 저장하고 반환합니다.
```

동일 계정주 검증은 `OwnerCheck` API로 분리됩니다. OwnerCheck는 Travel Rule 본문 검증이 아니라 미DD 상대, 비의무 VASP, 고위험 송수신 전에 사용할 수 있는 보강 검증 수단입니다.

# External Adapters

이 페이지는 과거 GTR adapter 문서 경로를 유지하기 위한 compatibility 문서입니다. 현재 Bonanza TTR core data plane은 외부 Travel Rule provider adapter가 아니라 Bonanza Public Key Directory와 CodeVASP-compatible relay입니다.

## Current Policy

| Adapter | Current status | Policy |
|---------|----------------|--------|
| `bonanza` | Active | 기본 relay. VASP public key 조회, 암호화 payload relay, 결과 metadata 관리 |
| `code` | Active-compatible | CodeVASP 구조와 암호화 모델을 유지하는 호환 경로 |
| `gtr` | Disabled | core scope 제외. `PROTOCOL_DISABLED` 반환 |
| `sumsub` | Disabled | core scope 제외. `PROTOCOL_DISABLED` 반환 |
| `verifyvasp` | Disabled | core scope 제외. `PROTOCOL_DISABLED` 반환 |

## Why It Changed

금융기관 판매 구조에서는 여러 해외 SaaS adapter를 병렬로 붙이는 것보다 다음 구조가 더 명확합니다.

1. Bonanza가 VASP public key directory를 운영합니다.
2. 송신 기관은 수신 VASP public key로 payload를 암호화합니다.
3. Bonanza는 암호화 payload와 상태 metadata만 relay합니다.
4. 금융기관은 Bonanza IDC 채널을 통해 전용성 회선, VPN/IPsec, mTLS 등 기존 VAN 수준의 접속 방식을 선택합니다.
5. 비금융 VASP와 해외 사업자는 cloud API 또는 SDK/assistant로 연동합니다.

## Disabled Response

비활성 adapter를 호출하면 다음과 같은 정책 응답을 반환합니다.

```json
{
  "status": "denied",
  "reasonType": "PROTOCOL_DISABLED",
  "reasonMsg": "External adapter is not enabled in the Bonanza TTR core data plane."
}
```

## Future Reintroduction

외부 provider adapter는 다음 조건이 충족될 때 별도 rail로 재검토합니다.

| Condition | Requirement |
|-----------|-------------|
| Legal basis | 개인정보 처리 위수탁, 국외이전, 재위탁 구조가 명확해야 합니다. |
| Data boundary | Bonanza가 평문 PII를 불필요하게 취급하지 않는 구조여야 합니다. |
| Operations | SLA, 장애 책임, audit evidence가 계약으로 분리되어야 합니다. |
| Product need | Public Key Directory 기반 relay로 해결되지 않는 명확한 수요가 있어야 합니다. |

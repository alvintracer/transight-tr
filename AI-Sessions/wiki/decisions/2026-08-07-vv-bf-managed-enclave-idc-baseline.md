---
type: decision
date: 2026-08-07
status: accepted
topic: VV BF-managed Enclave IDC baseline
source:
  - AI-Sessions/wiki/projects/2026-08-05-vv-travel-rule-gateway-regulatory-architecture.md
  - AI-Sessions/raw/VerifyVASP_Intro_250408.pdf
  - https://docs.verifyvasp.com/reference/travelrule-overview.md
  - https://docs.verifyvasp.com/reference/travelrule-enclave-setup.md
  - https://docs.verifyvasp.com/reference/travelrule-scenarios-and-flows.md
---

# VV-BF Managed Enclave IDC Baseline

## Decision

VV 연동의 국내 금융기관 기본 구조는 `BF-managed Enclave in IDC`로 확정한다.

금융기관은 자기 내부망이나 자체 DMZ에 VV Docker Enclave를 설치하지 않는다. 금융기관은 금융기관-보난자 IDC 간 승인된 암호화 채널을 통해 필요한 정보를 보난자 게이트웨이로 전송한다. 보난자는 기존 VAN/전자금융보조업자 및 개인정보 처리위탁 운영 경험을 전제로, 국내 IDC에서 VV Enclave를 운영하고 VV Central Server와 통신한다.

## Baseline Architecture

```text
금융기관/FI
  - 고객/KYC/출금 시스템
  - 내부 승인/AML 정책
        |
        | 전용선, 폐쇄형 IP-VPN, IPSec VPN, 또는 mTLS
        | 금융기관-BF 구간 암호화
        v
BF IDC Gateway
  - 금융기관 인증
  - 요청 검증
  - TranSight KYT/WLF 선차단
  - 거래 metadata/audit 관리
  - PII ephemeral processing zone
        |
        | 평문 PII는 메모리 내 일시 처리
        | 원문 저장/로그/cache 금지
        v
Tenant-dedicated VV Enclave
  - VV Enclave API 호출 수신
  - public key exchange
  - E2E encryption/decryption
  - VV Central Server 통신
  - Enclave DB
        |
        v
VV Central Server
        |
        v
Counterparty VASP Enclave
```

## Plaintext Boundary

이 구조에서는 "보난자가 평문 PII를 절대 보지 않는다"는 설명을 쓰지 않는다. 더 정확한 설명은 다음이다.

```text
보난자는 금융기관의 승인된 처리수탁자/전자금융보조업자 지위에서
국내 IDC의 통제 구간 안에서만 평문 PII를 일시 처리한다.
평문 PII는 E2E 암호화 직전/직후의 극히 짧은 구간에만 존재하고,
DB, 로그, 메시지 큐, 파일, 운영 화면에는 저장하지 않는다.
VV Central Server와 상대 VASP로 나가는 민감정보는 Enclave가 E2E 암호화한다.
```

저장 가능한 데이터는 거래 metadata, verification UUID, txHash, VASP/FI 식별자, 상태값, error code, KYT/WLF 결과, payload hash, 처리시각, 감사로그로 제한한다.

## Hub Enclave vs Per-Institution Enclave

### Option A. Single Hub Enclave

하나의 BF Hub Enclave가 여러 금융기관 요청을 모두 처리하는 구조다.

장점:

- 구축이 빠르다.
- 운영 인스턴스 수가 적다.
- VV onboarding, endpoint, whitelist 관리가 단순하다.

문제:

- VV network identity가 BF 또는 하나의 hub identity로 합쳐질 가능성이 있다.
- 금융기관별 VASP/FI identity, public key, credential, audit boundary가 약해진다.
- 한 기관 사고가 다른 기관으로 번지는 blast radius가 크다.
- 금융기관별 보존기간, 삭제, 장애, rate limit, SLA, 감사 대응이 섞인다.
- counterparty DD 관점에서 "실제 ordering/beneficiary institution"을 명확히 설명하기 어렵다.

판단:

- PoC, lab, 비규제/저위험 demo에는 가능하다.
- production 기본안으로는 비권장한다.
- VV가 공식적으로 multi-tenant Enclave, multiple VASP identity, tenant별 key/DB/log isolation을 지원한다고 확인되는 경우에만 재검토한다.

### Option B. Per-Institution Dedicated Enclave

금융기관 또는 법적 서비스 주체별로 VV Enclave Docker instance, DB, credential, key material, endpoint를 분리하는 구조다.

장점:

- 기관별 identity와 VV credential을 분리할 수 있다.
- key, Enclave DB, audit log, retention, SLA를 분리할 수 있다.
- 장애와 침해사고의 blast radius가 작다.
- 금융기관 보안성심의와 감사 대응이 쉽다.
- 고객 이탈, 계약 종료, 삭제 요청 시 해당 tenant만 정리 가능하다.
- "BF Gateway는 hub, Enclave는 기관별 trust boundary"라는 설명이 가능하다.

문제:

- 운영 인스턴스 수가 늘어난다.
- IaC, Kubernetes/VM, secrets, DB, monitoring 자동화가 필요하다.
- VV onboarding과 IP whitelist 절차가 기관 수만큼 늘 수 있다.

판단:

- production 기본안으로 채택한다.
- 대형 은행/보수적 금융기관은 dedicated VM 또는 dedicated host까지 검토한다.
- 인터넷전문은행, 전자금융업자, VASP는 shared Kubernetes cluster 안의 dedicated namespace + dedicated DB + dedicated secrets부터 시작할 수 있다.

## Recommended Shape

최종 표현은 `Hub Gateway + Tenant-dedicated Enclave`가 좋다.

```text
BF Gateway Control Plane
  - 금융기관 채널 수용
  - 인증/인가
  - 요청 표준화
  - KYT/WLF
  - metadata audit
  - routing

Tenant Enclave Plane
  - FI A Enclave + FI A DB + FI A secrets
  - FI B Enclave + FI B DB + FI B secrets
  - FI C Enclave + FI C DB + FI C secrets
```

물리적으로는 같은 IDC/클러스터에 있어도 된다. 다만 논리적으로는 기관별로 다음을 분리한다.

- Enclave container
- Enclave DB 또는 schema
- `VEGA_ALLIANCE_ACCESS_KEY`
- `VEGA_ALLIANCE_SECRET_KEY`
- DB encryption key
- VASP/FI API auth token
- public endpoint path 또는 subdomain
- audit partition
- retention policy
- rate limit/SLA
- operational access group

가능하면 기관별 outbound public IP도 분리한다. VV 문서상 Enclave server public IP를 whitelist하는 절차가 있으므로, 기관별 IP 분리가 가장 설명하기 쉽다. 비용 또는 네트워크 사정상 같은 BF egress IP를 쓰는 경우에는 VV와 금융기관 양쪽에 "tenant identity는 credential/endpoint/DB/key로 분리되고 IP는 BF managed gateway egress"라고 명시한다.

## Operational Rules

1. 평문 PII는 Enclave 호출 전후 memory-only 처리한다.
2. request/response body 원문 로그를 금지한다.
3. 장애 재처리가 필요하면 원문 PII queue를 만들지 않는다. 재요청은 금융기관 원천 시스템에서 다시 보내게 하거나, 불가피하면 tenant KMS로 짧은 TTL envelope encryption을 적용한다.
4. Enclave DB는 tenant별로 분리하고 BF 운영자가 직접 조회하지 않는 것을 원칙으로 한다.
5. 운영 화면에는 metadata, status, masked address, hash, error code만 노출한다.
6. KYT/WLF가 BLOCK이면 VV Enclave로 PII를 넘기지 않는다.
7. VV image update는 tenant별 change ticket과 rollback plan으로 관리한다.
8. 모든 admin access는 JIT, MFA, session recording, ticket binding을 적용한다.

## Positioning

금융기관 설명 문구:

```text
금융기관이 VV Docker Enclave를 직접 설치하거나 해외 VV Central과 직접 통신하지 않아도 됩니다.
보난자가 국내 IDC에서 기관별 전용 Enclave를 운영하고,
금융기관은 기존 VAN형 보안채널로 필요한 정보만 전송합니다.
보난자는 처리수탁자 지위에서 평문 PII를 저장하지 않고,
E2E 암호화 직전/직후의 통제 구간에서만 일시 처리합니다.
거래 metadata와 감사증적은 기관별로 분리 보관합니다.
```

## Open Confirmations With VV

VV에 확인해야 할 사항:

1. 하나의 BF IDC에서 기관별 Enclave 여러 개를 운영하는 partner-hosted model을 허용하는가.
2. 기관별 `VEGA_ALLIANCE_ACCESS_KEY`/`SECRET_KEY`와 VASP/FI ID를 발급할 수 있는가.
3. 금융기관이 VASP가 아닌 경우 VV network identity를 어떻게 표현할 것인가.
4. 동일 BF egress IP 아래 복수 Enclave 운영이 가능한가, 또는 기관별 public IP가 필요한가.
5. `VEGA_ENCLAVE_PUBLIC_ENDPOINT`를 BF gateway subdomain/path로 등록해도 되는가.
6. Enclave DB encryption key를 BF KMS/HSM에서 dynamic retrieval 하는 구조를 허용하는가.
7. BF가 운영하는 Enclave에 대한 보안감사/소스검토/이미지 검증 패키지를 제공할 수 있는가.

## Related

- [[AI-Sessions/wiki/projects/2026-08-05-vv-travel-rule-gateway-regulatory-architecture]]

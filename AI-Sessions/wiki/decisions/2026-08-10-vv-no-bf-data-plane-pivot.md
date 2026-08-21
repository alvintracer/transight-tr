---
type: decision
date: 2026-08-10
status: proposed
topic: VV feedback pivot from BF data-plane gateway to FI-hosted Enclave
source:
  - C:/Users/taewo/.codex/attachments/105cf506-6381-41d4-b87d-7cc7168aaa49/pasted-text.txt
  - AI-Sessions/wiki/design/2026-08-09-vv-enclave-deployment-options.md
  - AI-Sessions/wiki/decisions/2026-08-07-vv-bf-managed-enclave-idc-baseline.md
  - https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029334953
  - https://www.law.go.kr/LSW//lsLawLinkInfo.do?chrClsCd=010202&lsId=011357&lsJoLnkSeq=900079061&print=print
  - https://better.fsc.go.kr/fsc_new/replyCase/OpinionDetail.do?muGpNo=75&muNo=86&opinionIdx=2176&stNo=11
  - https://www.fsc.go.kr/no010101/86745
---

# VV No-BF-Data-Plane Pivot

## Summary

VV가 한국 개인정보보호법 및 GDPR 관점에서 "E2E 암호화된 정보라도 보난자 서버를 거치는 구조는 제외해야 한다"는 취지의 피드백을 제시했다. 이 피드백은 법문상 "무조건 위법"이라고 단정하기보다는, 보난자가 data path에 들어오는 순간 개인정보 처리, 재위탁, 국외이전, counterparty 계약관계 설명 부담이 커진다는 리스크 신호로 해석한다.

실무 판단은 다음과 같다.

1. 기존 옵션1 `BF IDC Gateway/Router + BF-hosted Enclave`는 상용 기본안에서 제외한다.
2. 기존 옵션2 `FI-hosted Enclave + BF IDC Proxy`도 VV의 no-BF-transit 원칙 아래에서는 기본안에서 제외한다.
3. 새 기본안은 `FI DMZ-hosted VV Enclave + direct VV Central communication`로 전환한다.
4. 보난자는 data plane이 아니라 implementation, managed operations, localization, KYT/WLF integration, monitoring, support plane을 담당한다.

## Correct Terminology

정확한 용어는 `Kubernetes`이며 한국어로는 보통 `쿠버네티스`라고 쓴다. `K8s`는 약어다.

Kubernetes는 Docker 같은 container workload를 배포, 재시작, 업데이트, 확장, 네트워크 정책 적용, secret/config 주입 방식으로 운영하는 container orchestration platform이다. DMZ를 만드는 기술은 아니다. DMZ는 네트워크 보안 구간이고, Kubernetes는 그 구간 안에서 Enclave container를 운영하는 수단이다.

## Revised Target Architecture

```text
FI Internal/Core Network
  - KYC/AML/customer system
  - withdrawal system
        |
        | controlled API, firewall, allowlist, minimum fields
        v
FI DMZ
  - DMZ-dedicated Kubernetes cluster or node pool
  - VV Enclave Docker
  - Enclave DB / local key integration
  - outbound only to VV Central allowlist
  - inbound callback endpoint from VV Central only
        |
        | direct TLS/mTLS to VV Central
        v
VV Central / VerifyVASP Network
        |
        v
Counterparty VASP/FI Enclave
```

보난자의 역할:

- VV Enclave deployment package 설계
- Kubernetes manifest/Helm chart/IaC 제공
- Enclave configuration 및 onboarding 지원
- VV image verification, SBOM, CVE, patch/rollback runbook 관리
- FI 내부 시스템과 Enclave API integration 지원
- KYT/WLF 사전 점검 API 또는 agent 연동
- monitoring, alerting, incident response 지원

보난자가 하지 않는 것:

- Travel Rule PII data plane transit
- BF IDC Proxy/NAT를 통한 VV Central relay
- BF-hosted Enclave에서 평문 PII 일시 처리
- verification payload/body logging

## Option Reclassification

| 구조 | BF 평문 PII 접근 | BF data path 존재 | 권고 |
|---|---:|---:|---|
| BF IDC Gateway + BF-hosted Enclave | 있음 | 있음 | 폐기 또는 별도 법률검토 후 예외 |
| BF IDC L7 reverse proxy/TLS termination | 가능 | 있음 | 폐기 |
| BF IDC L4/TLS passthrough proxy | 없음 | 있음 | 기술적으로 논쟁 가능하나 VV 원칙상 제외 |
| BF IDC NAT only | 없음 | 있음 | VV no-transit 원칙상 제외 |
| FI DMZ Proxy -> VV Central direct | 없음 | 없음 | 보조 가능 |
| FI DMZ VV Enclave -> VV Central direct | 없음 | 없음 | 새 기본안 |
| BF managed operations on FI-hosted infrastructure | 원칙상 없음 | 없음 | 상업적 기본 포지션 |

## Legal/Regulatory Interpretation

### 개인정보보호법

개인정보보호법 제28조의8은 개인정보 국외이전을 제공, 조회, 처리위탁, 보관까지 넓게 본다. 따라서 VV Central과 해외 counterparty VASP로 넘어가는 구조에는 국외이전 근거와 이전받는 자 보호조치가 필요하다.

제26조는 수탁자가 제3자에게 재위탁하려면 위탁자의 동의가 필요하다는 구조를 둔다. BF가 data plane에 들어오면 FI -> BF -> VV -> overseas counterparty의 위탁/재위탁/국외이전 chain을 설명해야 한다.

단, "암호문이 BF 서버를 통과하면 곧바로 명백한 위법"이라고 일반화하기는 어렵다. BF가 키를 갖지 않고 TLS를 terminate하지 않는 L4 relay라면 법적 성격은 더 논쟁적이다. 그러나 은행 심사와 VV 정책 관점에서는 이 회색지대를 방어할 실익이 작다.

### GDPR

GDPR은 processing에 transmission disclosure를 포함하고, encryption은 개인정보를 GDPR 밖으로 빼는 면책수단이 아니라 security measure 중 하나로 취급한다. 따라서 E2E encryption은 리스크를 낮추지만 계약, 역할, 이전 근거 문제를 자동으로 제거하지 않는다.

## Financial Network Separation

FI DMZ-hosted Enclave 구조는 개인정보 위탁 chain을 줄이는 데 유리하지만, 망분리 문제를 자동 해결하지 않는다.

2024-06-19 금융감독원 비조치의견은 내부통신망 시스템과 외부 SaaS가 DMZ 웹서버를 통해 API로 실시간 데이터를 송수신하는 구조를 문제 삼은 바 있다. 2026-04-20부터 SaaS 망분리 예외가 확대되었지만, 금융위 발표상 이용자의 고유식별정보 또는 개인신용정보를 처리하는 경우는 일반 예외에서 제외된다.

따라서 TR/VV 구조는 다음 판단을 받아야 한다.

1. FI internal system -> FI DMZ Enclave 실시간 API 연계가 업무상 불가피한 DMZ 연계로 인정되는가.
2. VV Enclave가 SaaS 이용인지, FI 자체 설치형 보안 gateway인지, 외부기관 연계용 전자금융 인프라인지 어떻게 분류되는가.
3. Travel Rule 데이터가 개인신용정보 또는 고유식별정보를 포함하는지.
4. 해외 VV Central 및 counterparty VASP로의 국외이전 근거를 어떻게 구성할지.
5. 필요 시 금융감독원 비조치의견 또는 사전 법령해석을 받을지.

## Product Positioning

새 포지션은 `VerifyVASP Managed Deployment & Integration Service for Korean Financial Institutions`가 적합하다.

```text
보난자는 VV 데이터를 중계하는 국내 게이트웨이가 아니라,
금융기관 DMZ 내 VV Enclave를 안전하게 구축·운영·통합하는 공식 구현 파트너다.

Travel Rule 개인정보 data plane은 금융기관 통제 구간의 Enclave와 VV Network 사이에 직접 형성하고,
보난자는 구축, 운영 자동화, 보안검증, KYT/WLF 연계, 모니터링, 장애대응을 제공한다.
```

## VV/FI Confirmation Questions

1. VV는 FI DMZ 내 Kubernetes 또는 VM에 Enclave를 설치하고 VV Central과 직접 통신하는 모델을 공식 지원하는가.
2. VV Central의 실제 processing/storage/backup/DR region은 어디인가.
3. User Verification, User Account Verification, Callback 등 API별 application-level E2E 암호화 범위는 정확히 어디까지인가.
4. 한국 FI와 해외 VV member 사이의 개인정보 국외이전 및 counterparty contract chain을 VV Network Rules/Alliance Agreement가 어떻게 커버하는가.
5. FI별 Enclave public endpoint를 FI DMZ endpoint로 직접 등록할 수 있는가.
6. BF가 management plane에서 운영 지원을 할 경우 remote access, JIT approval, session recording, source/image review, SBOM, CVE, patch/rollback 자료를 어떻게 제공할 수 있는가.


---
type: design
date: 2026-08-11
status: draft
topic: KakaoPay FI DMZ-hosted VerifyVASP Enclave direct integration
source:
  - AI-Sessions/wiki/decisions/2026-08-10-vv-no-bf-data-plane-pivot.md
  - AI-Sessions/wiki/decisions/2026-08-11-vv-swift-mt-precedent-applicability.md
  - AI-Sessions/wiki/design/2026-08-09-vv-enclave-deployment-options.md
---

# 카카오페이-VV DMZ 직접 연동 구조

## 목적

카카오페이가 금융기관/FI 역할로 VerifyVASP(VV)를 직접 연동하는 경우의 기준 구조다. 핵심은 `카카오페이 DMZ 내 VV Enclave 설치`와 `VV Central 직접 통신`이다.

이 구조는 제3자 IDC Gateway/Proxy 모델이 아니라, 카카오페이 통제 구간 안에 VV Enclave를 배치하는 방식이다. 외부 사업자는 필요한 경우 기술자문만 수행하며, TR payload의 중계, 저장, 관제, 운영접근 주체가 되지 않는다.

## 전제

1. 카카오페이 내부망 업무시스템은 VV Central 또는 해외 SaaS와 직접 통신하지 않는다.
2. VV Enclave Docker는 카카오페이 DMZ 또는 대외계 보안구간에 설치한다.
3. Enclave의 `public endpoint`는 카카오페이 DMZ endpoint로 VV Central에 등록한다.
4. Enclave outbound는 카카오페이 공인 egress IP를 VV에 whitelist 등록하고, VV Central의 고정 endpoint/port만 허용한다.
5. 외부 기술자문자는 TR payload 또는 평문 PII를 중계, 저장, 처리하지 않는다.
6. DMZ에는 원문 PII body log를 남기지 않는다. Enclave DB가 필요하면 암호화, TTL, 접근통제, 내부 KMS/HSM 연계를 적용한다.

## 아키텍처 구조도

```mermaid
%% 4:3 slide-friendly layout: 3 horizontal bands, compact labels.
flowchart TB
  subgraph KPINT["카카오페이 내부망"]
    direction LR
    CORE["출금/입금/KYC/AML 시스템"]
    KMS["내부 KMS/HSM<br/>key unwrap"]
    LOG["Audit/SIEM<br/>masked metadata"]
  end

  subgraph KPDMZ["카카오페이 DMZ / 대외계"]
    direction LR
    EAI["DMZ API/EAI<br/>mTLS, schema"]
    ENC["VV Enclave Docker<br/>E2E, VV API"]
    EDB[("Enclave DB<br/>encrypted, TTL")]
    EDGE["Public Endpoint / FW<br/>callback, allowlist"]
  end

  subgraph VVNET["VerifyVASP Network"]
    direction LR
    VVC["VV Central"]
    CP["상대 VASP/FI Enclave"]
  end

  CORE -->|"최소 필드<br/>내부 승인 API"| EAI
  EAI -->|"local Enclave API"| ENC
  ENC --- EDB
  ENC -->|"DB key unwrap"| KMS
  ENC -.->|"UUID, txHash,<br/>status only"| LOG

  ENC -->|"outbound TLS/mTLS<br/>KP egress IP whitelist"| EDGE
  EDGE -->|"fixed endpoint/port"| VVC
  VVC -->|"callback / inbound request"| EDGE
  EDGE --> ENC
  VVC -->|"encrypted IVMS101 relay"| CP
```

## 시퀀스 다이어그램

아래 흐름은 카카오페이가 송신기관(OFI)으로 출금을 처리하면서 수취 VASP/FI에 Travel Rule 검증을 수행하는 기준 시나리오다.

```mermaid
%% 4:3 slide-friendly layout: 5 participants, short message labels.
sequenceDiagram
  autonumber
  participant CORE as 카카오페이 Core
  participant EAI as DMZ API/EAI
  participant ENC as DMZ VV Enclave
  participant VVC as VV Central
  participant CP as 상대 VASP/FI Enclave

  CORE->>EAI: 출금/TR 검증 요청<br/>고객, 지갑주소, 거래정보
  EAI->>EAI: mTLS, schema validation,<br/>필드 최소화, 로그 마스킹

  EAI->>ENC: Account Verification<br/>주소/이름 사전 확인
  ENC->>VVC: Account check 요청<br/>KP egress IP 직접 통신
  VVC->>CP: account check relay
  CP-->>VVC: account check result
  VVC-->>ENC: callback 또는 polling result
  ENC-->>EAI: account verification result

  alt account check 실패 또는 정책상 차단
    EAI-->>CORE: 출금 보류/거절<br/>PII 추가 전송 중단
  else account check 통과
    CORE->>EAI: User Verification 진행 승인
    EAI->>ENC: User Verification<br/>IVMS101 payload
    ENC->>VVC: 수신 Enclave 공개키 조회
    VVC-->>ENC: public key, VASP status
    ENC->>ENC: IVMS101 E2E 암호화
    ENC->>VVC: encrypted IVMS101 payload
    VVC->>CP: encrypted IVMS101 relay
    CP->>CP: 복호화 및 수취인 검증
    CP-->>VVC: verification result
    VVC-->>ENC: VERIFICATION_RESULT callback
    ENC-->>EAI: verified / denied / error
    EAI-->>CORE: 출금 가능 여부 반환
  end

  opt 출금 실행 후
    CORE->>EAI: txHash, transfer id 보고
    EAI->>ENC: Transaction Result Report
    ENC->>VVC: txHash report
    VVC-->>ENC: report accepted
    ENC-->>EAI: 처리 결과
  end
```

## 규제 설명 포인트

이 구조는 `카카오페이가 해외 SaaS를 내부망에서 직접 호출하는 구조`가 아니라, `카카오페이 DMZ 대외계 구간에 설치된 전문처리 시스템이 특정 VV Central endpoint와 통신하는 구조`로 설명한다.

외부 설명 문구는 다음처럼 잡는 것이 좋다.

```text
카카오페이 통제 구간의 DMZ/대외계 영역에 VV Enclave를 설치하고,
해당 Enclave가 Travel Rule/AML 목적의 표준화된 전문을 특정 VV Central endpoint와 직접 송수신한다.
외부 기술자문자는 구조 검토와 구축 자문만 수행하며,
Travel Rule 개인정보 payload의 중계자, 처리자, 운영자가 되지 않는다.
```

## 확인 필요 항목

1. 카카오페이가 VV Enclave를 DMZ 내 Docker/Kubernetes 또는 VM에 설치할 수 있는지.
2. DMZ에 Enclave DB를 둘 수 있는지, 또는 DB/key/log는 내부 보호구간으로 분리해야 하는지.
3. VV Central endpoint, port, outbound IP whitelist, callback public endpoint 등록 방식.
4. `User Account Verification`의 평문 처리 구간과 로그 금지/마스킹 통제.
5. `User Verification`의 E2E 암호화 범위와 public key 교환 방식.
6. 외부 기술자문 범위를 문서 검토/구축 자문으로 제한하고, 운영접근이 필요한 경우 별도 승인 대상으로 둘지 여부.

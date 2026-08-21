---
type: project
date: 2026-08-05
status: draft
topic: VerifyVASP domestic Travel Rule gateway
source:
  - docs/TRANSIGHT_PROJECT_CONTEXT.md
  - docs/ttr-api-specification.md
  - docs/alliance-strategy.md
  - docs/ko/internal/vasp-integration-cost.md
  - AI-Sessions/raw/2차 학습노트_VV수정권고안.docx
  - AI-Sessions/raw/3차노트.docx
  - AI-Sessions/raw/VerifyVASP_Intro_250408.pdf
---

# VV 국내 트래블룰 게이트웨이 규제·기술 구조 분석

> 내부 전략/설계 초안. 법률의견서가 아니며, 금융회사별 도입 전에는 준법감시, 정보보호, 개인정보, 외부위탁 담당부서 및 외부 법률자문 확인이 필요하다.

## 1. 한 줄 결론

VerifyVASP(VV)를 한국 금융기관이 직접 구축·이용하게 하는 모델보다, 보난자팩토리가 VV의 정식 국내 구축 파트너로서 국내 IDC 또는 국내 클라우드에 `Travel Rule Gateway`를 구축하고 금융기관은 전용선, 폐쇄형 IP-VPN, IPSec VPN, mTLS 중 기관별 승인 채널로 연결하는 모델이 규제·보안·운영 심사 통과 가능성이 높다.

핵심은 "VV 해외 SaaS를 금융기관 내부망에서 직접 쓰게 하는 것"이 아니라, "국내 통제권, 국내 감사증적, 국내 망분리 대응, 소스/이미지 검증 가능성을 갖춘 금융기관용 게이트웨이"로 재구성하는 것이다.

## 2. 이번 사업 방향의 의미

기존 TranSight TR은 CODE, Sumsub, GTR, Direct, 내부 Transight rail을 연결하는 비대칭 Travel Rule Hub로 설계되어 있었다. VV rail은 stub였고, 향후 Bilateral Agreement 대상이었다.

이번 방향 전환은 단순 어댑터 추가가 아니다. 포지션이 다음과 같이 바뀐다.

| 구분 | 기존 관점 | 확장 관점 |
|---|---|---|
| VV | 폐쇄형 외부 rail | 보난자팩토리가 국내 구축·운영하는 핵심 rail |
| 고객 | VASP 및 금융기관 | 은행, 전자금융업자, 간편결제, 수탁·스테이블코인 사업자 |
| 핵심 가치 | 프로토콜 라우팅 | 국내 규제형 게이트웨이, 망분리 대응, VV 연결성 |
| 기술 자산 | TTR Hub, KYT Gate, Protocol Adapter | VV enclave/API stack, VerifyName, VerifyWallet류 기능, 국내 보안 채널 |
| 사업 지위 | Travel Rule hub | VAN형 전자금융보조업자 경험을 활용한 Travel Rule Gateway 사업자 |

이 문서에서 말하는 `게이트웨이`는 VV 소프트웨어를 단순 재판매하는 중계 서버가 아니다. 금융기관의 정보보호 심사와 감독기관 대응을 통과할 수 있게 국내 운영권, 감사권, 네트워크 경계, 소스/이미지 검증, 로그 보존, 장애 대응을 묶은 관리형 준법 인프라다.

## 3. 규제상 출발점

### 3.1 트래블룰 자체

특정금융정보법상 트래블룰은 가상자산사업자가 다른 가상자산사업자에게 일정 금액 이상의 가상자산을 이전할 때 송·수신인 정보를 제공·보관하도록 하는 구조다. 2022년 3월 25일부터 시행되었고, 금융위원회 보도자료는 100만원 상당 이상 VASP 간 이전, 송·수신인 성명과 가상자산주소 제공, 요청 시 송신인 주민등록번호 등 추가 제공, 5년 보관, 위반 시 감독조치 가능성을 설명한다.

시행령 제10조의10은 현재도 핵심 구조를 유지한다.

- VASP 간 100만원 이상 상당 가상자산 이전 시 정보 제공
- 송신·수신 고객의 성명 및 가상자산주소 제공
- FIU 또는 수신 VASP 요청 시 송신 고객의 주민등록번호, 법인등록번호, 여권번호, 외국인등록번호 등 제공
- 기본 정보는 이전과 함께 제공, 추가 정보는 요청일로부터 3영업일 이내 제공

따라서 은행·전자금융업자가 현재 곧바로 모든 경우에 트래블룰 의무주체가 되는 것은 아니다. 다만 은행, 전자금융업자, 수탁사, 스테이블코인 사업자가 가상자산 이전, 보관, 지급, 환전, 발행 관련 서비스를 제공하는 순간 VASP 또는 그에 준하는 AML/CFT 통제 주체로 평가될 가능성이 커진다. 실무적으로는 "법상 의무가 지금 당장 누구에게 있는가"와 별개로, 거래소·해외 VASP와 연결하기 위해 Travel Rule compatible infrastructure가 필요해진다.

### 3.2 금융보안과 망분리

전자금융거래법 제21조는 금융회사등의 안전성 확보 의무를 두고, 세부 기준은 전자금융감독규정이 정한다.

현행 전자금융감독규정 제15조는 다음 축을 유지한다.

- 내부 업무용 시스템은 인터넷 등 외부통신망과 분리·차단하고 접속을 금지
- 전산실 내 정보처리시스템 및 운영·개발·보안 접속 단말은 외부통신망으로부터 물리적 분리
- 연구·개발 또는 업무상 불가피한 경우 예외가 있으나, 위험성 평가, 대체통제, 정보보호위원회 승인, 금융감독원 확인·인정이 필요
- 정보보호시스템 원격관리는 원칙적으로 금지되며, 불가피하면 전용회선 또는 동등한 보안수준의 가상 전용회선과 접근통제 등 보안대책이 필요

2024년 금융분야 망분리 개선 로드맵과 2026년 SaaS 예외 확대는 방향성상 완화 흐름이지만, 생산계 TR 게이트웨이에 그대로 적용할 수 있는 만능 면제 근거는 아니다. 2026년 4월 20일 시행된 SaaS 예외는 문서작성, 화상회의, 협업, 성과관리 등 사무관리·업무지원 성격이 중심이고, 고유식별정보 또는 개인신용정보를 처리하는 경우에는 예외를 허용하지 않는다고 설명되어 있다.

따라서 VV production gateway는 "SaaS 예외로 내부망에서 해외 SaaS 사용"이라는 논리보다, "금융기관 외부연계 구간에 대한 폐쇄형 보안채널, DMZ/중계망, 국내 위탁·클라우드 절차, 대체통제" 논리로 설계해야 한다.

### 3.3 클라우드 이용

전자금융감독규정 제14조의2는 금융회사 또는 전자금융업자가 클라우드컴퓨팅서비스를 이용하려면 다음 절차를 수행하도록 한다.

- 이용업무 중요도 평가
- 클라우드 서비스 제공자의 건전성 및 안전성 평가
- 업무연속성 계획 및 안전성 확보조치 수립·시행
- 정보보호위원회 심의·의결
- 신규 이용계약 또는 신규 업무 처리 등 사유 발생일로부터 3개월 이내 금융감독원 보고
- 보고서류가 불충분하면 금융감독원장이 개선·보완 요구 가능

또한 고유식별정보 또는 개인신용정보를 클라우드로 처리하는 경우 해당 정보처리시스템 국내 설치 요구가 남아 있다. 이 점 때문에 VV 본사 또는 해외 클라우드가 생산계 TR payload, 계정주 확인 데이터, transaction metadata를 직접 처리하는 구조는 금융기관 내부 심사에서 큰 부담이 된다.

### 3.4 정보처리 위탁

금융회사가 자신의 정보처리 업무를 제3자에게 계속적으로 처리하게 하면 정보처리 업무 위탁 이슈가 생긴다. 클라우드 이용도 정보처리 위탁 구조일 때 전자금융감독규정 제14조의2와 정보처리 업무 위탁 규정이 함께 문제된다.

특히 개인고객의 식별 가능한 금융거래정보 처리업무를 위탁하는 경우에는 수탁자의 국내·국외 소재지에 따라 보고 절차가 달라진다. 검색 가능한 법령정보 기준으로 국외 수탁자는 30영업일 전, 국내 수탁자는 7영업일 전 보고 구조가 남아 있다. 실제 적용 여부는 고객 데이터의 성격, 암호화 상태, 위탁 범위, 금융기관이 해당 업무를 자기 업무로 처리하는지에 따라 법무 검토가 필요하다.

보난자팩토리 게이트웨이 모델은 이 절차를 없애는 것이 아니라, 금융기관이 반복적으로 VV 해외법인·해외 클라우드·블랙박스 enclave를 직접 심사하는 부담을 국내 수탁자/전자금융보조업자형 구조로 정리해 주는 모델이다.

## 4. PII 암호문의 규제상 취급

VV 약관은 Licensee가 End User Data를 암호화해 전송하고, VV가 이를 복호화할 key code를 갖지 않으며, 중개자/수신기관만 복호화할 수 있다는 구조를 설명한다. 기술적으로는 보난자팩토리 게이트웨이도 payload 평문을 보지 않는 구조가 가능하다.

다만 국내 금융기관 심사에서는 다음처럼 보수적으로 분류해야 한다.

| 데이터 | 예시 | 게이트웨이 관점의 권장 분류 |
|---|---|---|
| 암호화 IVMS101 payload | 성명, 생년월일, 주소 등 수신자 공개키로 암호화된 payload | 평문 비열람이더라도 보호대상 암호문으로 취급 |
| 거래 metadata | transferId, VASP ID, 지갑주소, 가상자산, 금액, 요청시각, TXID | 개인·신용·금융거래정보로 결합 가능성이 있으므로 보호대상으로 취급 |
| 로그 | API 요청/응답, 오류, routing result, verification ID | 원문 payload 미저장, 해시·토큰화·마스킹 원칙 |
| 키·인증정보 | API key, client cert, signing key, webhook token | HSM/KMS 또는 이에 준하는 관리 대상 |

중요한 판단은 "payload가 암호문이므로 개인정보가 아니다"가 아니다. 더 안전한 논리는 "게이트웨이는 평문 PII를 처리하지 않는 구조이지만, 암호문과 metadata도 금융보안상 보호대상으로 취급하고 개인정보/신용정보 안전성 확보조치 수준의 통제를 적용한다"이다.

이렇게 잡아야 금융기관 CISO, 정보보호위원회, 준법감시인이 받아들이기 쉽다.

## 5. 권장 목표 아키텍처

### 5.1 전체 구조

```text
금융기관 내부 업무망
  - 고객/KYC 시스템
  - 가상자산 서비스/스테이블코인 서비스
  - 내부 승인/AML 시스템
        |
        | 내부 API 또는 전문
        v
금융기관 외부연계 구간 / DMZ / EAI
  - 전문 변환
  - 송신 큐
  - 기관 인증서/서명
        |
        | 전용선, 폐쇄형 IP-VPN, IPSec VPN, 또는 mTLS
        v
Bonanza 국내 TR Gateway
  - 기관별 tenant isolation
  - TranSight KYT Atomic Gate
  - VV Enclave/API Gateway
  - VerifyName/TravelRule orchestration
  - Protocol Adapter Layer
  - audit log, SIEM, WORM archive
  - KMS/HSM, secret vault
        |
        | 제한된 egress, allowlist, mTLS, signed request
        v
VerifyVASP network / counterparty VASP
  - VV Central/API
  - counterparty enclave
  - beneficiary VASP
```

### 5.2 권장 배치

1. 보난자팩토리 IDC 또는 국내 리전 클라우드에 VV Gateway zone 구축
2. 금융기관별 논리 tenant 분리, 가능하면 네트워크 segment와 key material 분리
3. 금융기관 내부 업무망은 직접 인터넷/VV Central과 통신하지 않음
4. 금융기관 DMZ 또는 외부연계망에서 보난자 게이트웨이에만 연결
5. 보난자 게이트웨이의 outbound는 VV Central, counterparty endpoint, 보안관제, 패치 저장소 등 승인된 대상만 allowlist
6. payload 평문은 금융기관 또는 최종 수신기관에서만 생성/복호화
7. 게이트웨이는 암호문 relay, routing, policy decision, KYT, audit만 수행

### 5.3 금융기관 연결 채널 판단

전용선만 유일한 옵션은 아니다. 현행 규정 체계에서도 동등한 보안수준의 가상 전용회선, VPN, mTLS 기반 외부기관 연계는 설계 가능하다. 다만 기관별 CISO 승인 난이도는 다르다.

| 옵션 | 적법 가능성 | 은행 심사 난이도 | 권장 용도 |
|---|---:|---:|---|
| 물리 전용선/폐쇄망 | 높음 | 낮음 | 보수적 시중은행, 핵심 생산계 |
| 통신사 MPLS/IP-VPN | 높음 | 낮음~중간 | 기존 VAN형 연계 대체 |
| IPSec VPN | 가능 | 중간 | 인터넷전문은행, 핀테크, PoC 후 생산 전환 |
| mTLS over public internet | 가능하나 보수적 검토 필요 | 중간~높음 | 전자금융업자, 낮은 위험 업무, 임시/백업 채널 |
| 금융기관 내부망에서 VV 해외 API 직접 호출 | 낮음 | 매우 높음 | 비권장 |

실무 권장안은 다음과 같다.

- 1차 제안: 전용선 또는 폐쇄형 IP-VPN
- 2차 제안: IPSec VPN + mTLS + Ed25519 request signing + 기관 IP allowlist
- 예외 제안: mTLS only는 production core가 아닌 sandbox, pilot, 저위험 기능에 한정
- 모든 경우: 내부 업무망 직접 outbound 금지, DMZ relay, queue, protocol break, payload size limit, replay protection, SIEM 연계

payload가 암호문이라는 사실은 채널 보안 요구를 낮추는 보조 근거일 뿐이다. metadata와 운영 명령, 인증정보, transaction state도 보호대상이므로 채널 자체는 금융기관 외부연계 보안 기준을 충족해야 한다.

## 6. VV enclave/Docker 블랙박스 이슈 대응

금융기관이 가장 불편해할 부분은 Docker 배포형 enclave가 외부 벤더의 블랙박스로 내부 또는 DMZ에 들어오는 구조다. "DBS가 소스를 보고 승인했다"는 레퍼런스는 도움이 되지만, 한국 금융회사 심사에서는 다음 패키지가 필요하다.

### 6.1 최소 통제 패키지

| 이슈 | 금융기관 우려 | 게이트웨이 대응 |
|---|---|---|
| 소스 비공개 | 악성 기능, 과도한 수집, hidden egress 확인 불가 | 소스 열람권, 소스 escrow, 보안검토실 운영 |
| Docker image 불투명 | 소스와 이미지가 같은지 불명확 | reproducible build, image digest 고정, vendor signature, SBOM |
| 자동 업데이트 | 변경승인 없는 기능 변경 | 업데이트 freeze, change approval, canary, rollback |
| outbound 통신 | 해외 endpoint로 데이터 유출 가능성 | egress allowlist, L7 proxy, DNS pinning, TLS inspection 가능 범위 검토 |
| key custody | 벤더가 키를 볼 가능성 | 기관별 key separation, KMS/HSM, secret injection, no key in image |
| 컨테이너 권한 | host escape, lateral movement | non-root, read-only FS, no privileged, seccomp/AppArmor, network policy |
| 로그 유출 | payload 또는 token 로그 노출 | log redaction, structured log schema, payload hash only |
| 운영자 접근 | vendor remote support 남용 | no standing access, JIT approval, session recording, break-glass |
| 취약점 | CVE, supply-chain risk | SAST/DAST/container scan, dependency scan, penetration test |
| 감독 대응 | 감사증적 부족 | WORM log, SIEM, monthly control report, incident SLA |

### 6.2 소스 공개만으로 부족한 이유

소스를 보여줄 수 있다는 것은 첫 관문이다. 그러나 금융기관은 실제 운영 중인 artifact가 검토한 소스에서 만들어졌는지, 운영 중 egress가 통제되는지, 업데이트가 승인되는지, 사고 시 조사권이 보장되는지를 본다.

따라서 보난자팩토리 게이트웨이는 다음을 계약 및 운영절차에 넣어야 한다.

- VV가 제공한 source 또는 review bundle의 version tag 관리
- build pipeline 증적, image digest, 서명 검증 결과 보관
- 운영 image registry를 보난자 통제 영역에 두고 외부 pull 금지
- patch/update는 보난자 CAB 및 금융기관 통보 후 반영
- VV remote support는 보난자 bastion을 통해 JIT 방식으로만 허용
- 금융기관 또는 제3자 보안평가사가 연 1회 이상 검증 가능
- 취약점 발견 시 SLA, 긴급 패치 절차, 임시 차단 절차 명시

## 6.3 보난자 DMZ/게이트웨이 내 managed enclave 배치 판단

2026-08-07 raw 검토 기준, `VerifyVASP_Intro_250408.pdf`는 VV 구조를 "양쪽 VASP 내부 서버 옆의 VerifyVASP Enclave + Central API Server + VASP routing + wallet verification/public key exchange"로 설명한다. 즉, Enclave는 단순 통신 어댑터가 아니라 PII 처리, key pair generation, public key exchange, E2E encryption의 신뢰 경계에 들어가는 핵심 컴포넌트다.

따라서 VASP가 Docker Enclave를 직접 수용하기 어렵다는 이유로 보난자 게이트웨이 또는 DMZ에 Enclave를 대신 두는 것은 가능하더라도, 다음 두 모델을 구분해야 한다.

| 모델 | 구조 | 판단 |
|---|---|---|
| Ciphertext relay 모델 | VASP가 자체 SDK/HSM/얇은 클라이언트로 payload를 먼저 암호화하고, 보난자 게이트웨이는 암호문만 relay | 최선. 기존 "Hub는 평문 PII 비열람" 논리 유지 가능 |
| Managed enclave 모델 | VASP가 평문 PII를 보난자 게이트웨이로 보내고, 보난자 관리 Enclave가 암호화 후 VV network로 전달 | 가능하지만 보난자가 PII 처리 수탁자/processor가 되므로 계약·동의·감사·망통제 부담 증가 |

전화국 비유를 쓰려면 "전화국이 봉투를 배달한다" 수준이어야 한다. 보난자가 평문을 받아 암호화한다면 전화국이 내용을 보고 다시 봉투에 넣는 것과 같아지므로, 더 이상 엄격한 의미의 VASP-to-VASP E2E 비열람 구조라고 설명하면 안 된다.

Managed enclave 모델을 채택하려면 다음 조건이 필요하다.

- VV가 보난자의 hosted/managed enclave 또는 partner-operated enclave 구조를 계약상 허용해야 한다.
- VASP별 전용 Enclave 또는 최소 VASP별 독립 tenant/key/endpoint를 둬야 한다. shared key나 shared enclave identity는 피한다.
- VV network와 counterparty VASP가 보는 member identity, certificate, public key는 "보난자"가 아니라 해당 VASP 또는 "보난자 on behalf of 해당 VASP"로 명확해야 한다.
- private key는 VASP별 HSM/KMS에 분리 보관하고, 보난자 운영자가 export하거나 임의 사용하지 못하게 해야 한다.
- 평문 PII는 Enclave 메모리 내 일시 처리만 허용하고, DB/log/cache/message queue에는 원문 저장을 금지한다.
- VASP와 보난자 사이에는 정보처리 위탁/DPA, 목적 제한, 재위탁, 사고통지, 감사권, 삭제/보존 정책이 필요하다.
- 금융기관 또는 VASP의 내부망이 아니라 DMZ/EAI/외부연계망에서만 통신하고, 채널은 전용선/IP-VPN/IPSec/mTLS 중 기관 승인 방식으로 제한한다.
- "Docker container"는 TEE가 아니므로 host 관리자 관점에서 완전한 기밀성을 보장하지 않는다는 점을 전제로 OS hardening, runtime policy, memory/log 접근통제, JIT 접근, session recording을 추가해야 한다.

권장 순서는 다음과 같다.

1. VASP 내부 설치 부담을 줄이는 `thin encryption client` 또는 SDK 방식이 VV에서 가능한지 먼저 확인한다.
2. 불가능하면 보난자 DMZ의 VASP별 managed enclave를 검토한다.
3. 이 경우 영업 메시지는 "보난자가 평문을 보지 않는다"가 아니라 "보난자가 승인된 수탁자로서 국내 통제 환경에서 최소 처리하고, 원문을 저장하지 않으며, 암호화 후 즉시 relay한다"로 조정한다.
4. 최종적으로 금융기관용 설명에서는 strict E2E, managed encryption, relay-only를 아키텍처 옵션으로 분리해 제시한다.

## 6.4 VV Screening API 기능 범위

2026-08-07 확인 기준, VV 공개 개발문서는 TravelRule flow의 optional screening으로 다음 Enclave API를 제공한다.

| API | endpoint | 성격 | 외부 라이선스/API key |
|---|---|---|---|
| Chainalysis Sanction | `/v1/risk-assessment/chainalysis-sanction` | 지갑주소 제재/고위험 여부 확인. 응답은 `NOHIT` 또는 `SANCTION` 중심 | Chainalysis Sanction API key 필요 |
| Chainalysis KYT | `/v1/risk-assessment/chainalysis-kyt` | 지갑주소 또는 txHash 기반 거래 위험평가. 비동기 callback | Chainalysis KYT 유료 라이선스/API key 필요 |
| Refinitiv WCO | `/v1/risk-assessment/refinitiv-wco` | 개인/법인 PII 기반 World-Check screening. 비동기 callback | Refinitiv WCO 유료 라이선스/API key/secret/group ID 필요 |

공식 flow상 screening은 TravelRule Best Practice의 필수 4단계가 아니라 optional risk-based verification이다. 사용자 검증(`POST /verifications`) 후 `verificationUuid`를 기준으로 호출하며, 결과는 Enclave DB에 저장되고 VASP backend callback으로 전달된다.

따라서 "VV에 Name Screen/WLF가 네이티브로 있느냐"는 질문에는 다음처럼 답하는 것이 정확하다.

- 이름 기반 screening은 Refinitiv WCO 연동을 통해 가능하다.
- 지갑 WLF/sanction screening은 Chainalysis Sanction API 연동을 통해 가능하다.
- 더 정교한 KYT/transaction monitoring은 Chainalysis KYT 연동을 통해 가능하다.
- 다만 이는 VV 자체 독자 데이터베이스라기보다 VV Enclave가 외부 screening provider를 호출하는 통합 인터페이스다.
- BYOK 또는 자체 watchlist를 Enclave Risk Assessment API에 직접 넣는 기능은 현재 확인한 공개 문서와 raw 자료에서는 식별되지 않았다.

VVxBF 관점에서는 VV의 optional screening을 그대로 쓰는 방법과 TranSight KYT/WLF를 Enclave 앞단의 Atomic Gate로 붙이는 방법을 분리해야 한다. 국내 금융기관 대상 기본 제안은 `TranSight KYT/WLF 선차단 + VV TravelRule/VerifyName + 필요 시 Chainalysis/Refinitiv optional screening` 구조가 가장 방어적이다.

## 6.5 Enclave API 경계와 split 판단

2026-08-07 VV 공식 docs 확인 기준, TravelRule 연동은 두 API 표면으로 나뉜다.

### API 표면

| 표면 | 누가 구현/제공 | 누가 호출 | 성격 |
|---|---|---|---|
| Enclave API | VV Enclave Docker | VASP/FI backend | VV Central로 요청을 보내기 위한 로컬 API |
| VASP API | VASP/FI backend | VV Enclave | 수취주소 확인, PII 검증, callback, tx 상태 응답 |

Enclave API core는 다음 9종으로 보는 것이 실무상 가장 명확하다.

| API | endpoint | 주 역할 |
|---|---|---|
| Get VASP ID | `GET /v1/vasps/self` | 자기 VASP ID 조회 |
| List VASP | `GET /v1/vasps` | member VASP 목록/상태 조회 |
| User Account Verification | `POST /v1/verifications/account` | 수취 주소 소유 확인 요청 |
| User Verification | `POST /v1/verifications` | IVMS101 기반 본 검증 요청 |
| Report Transaction Result | `POST /v1/verifications/tx` | txHash 보고 |
| Report Error | `POST /v1/verifications/error` | 중단/오류 보고 |
| Check Transaction Status | `POST /v1/verifications/tx/inquiry` | 누락 tx report에 대한 상태 질의 |
| List Verification Result | `GET /v1/verifications` | 검증 이력 목록 조회 |
| Get Verification Result | `GET /v1/verifications/{uuid}` | 검증 이력 단건 조회 |

Optional screening은 별도 3종으로 붙는다: `POST /v1/risk-assessment/chainalysis-sanction`, `POST /v1/risk-assessment/chainalysis-kyt`, `POST /v1/risk-assessment/refinitiv-wco`.

VASP API는 4 core + 1 auxiliary로 보는 것이 정확하다.

| API | 성격 |
|---|---|
| Verify User Account API | BFI 역할에서 주소 소유 여부 확인 |
| Verify User API | BFI 역할에서 IVMS101 PII 및 내부 정책 검증 |
| Check Transaction Status API | OFI 역할에서 tx 상태 질의에 응답 |
| Callback API | 검증결과, tx report, error report 등 비동기 결과 수신 |
| Database Management API | Enclave DB 암복호화용 symmetric key 제공. 환경변수 주입 대안이 있는 auxiliary |

### 평문/암호문 경계

VV docs는 "VASP backend는 Central API를 직접 호출하지 않고 Enclave API만 호출한다"고 설명한다. 따라서 VASP backend -> Enclave 구간의 API 예시는 평문 JSON으로 보인다. 특히 `User Account Verification`은 `beneficiary.accountNumber`가 평문 payload로 들어간다. `User Verification` 역시 Enclave에 들어가는 로컬 API 요청 예시는 IVMS101 평문 구조다.

그러나 Central 구간에서는 Enclave가 민감정보를 수신 Enclave 공개키로 암호화한 뒤 전송한다. 즉 정확한 표현은 다음과 같다.

- VV Central은 민감정보를 복호화하지 않는 구조다.
- Enclave가 설치된 위치의 운영 주체는 평문 입력을 볼 수 있는 신뢰 경계에 들어간다.
- BF가 Enclave를 대신 운영하면 BF는 PII processor/수탁자 리스크를 부담한다.
- VASP/FI 영역에 crypto component가 남아 있으면 BF는 암호문 relay 논리를 유지할 수 있다.

### Central 통신 설정

Enclave setup 문서에는 `VEGA_API_ENDPOINT`가 있으며, KR/Global PRD/STG Central API URL이 환경변수로 설정된다. 또한 `VEGA_ENCLAVE_PUBLIC_ENDPOINT`는 Central이 도달 가능한 공개 HTTPS endpoint로 설정한다.

따라서 아웃바운드 목적지가 완전히 코드에 하드코딩되어 있다고 단정하기 어렵다. 더 정확한 가설은 다음이다.

| 가설 | 의미 | 판단 |
|---|---|---|
| 일반 TLS + configurable `VEGA_API_ENDPOINT` | BF L7 proxy endpoint를 `VEGA_API_ENDPOINT`로 지정 가능 | 가장 가능성 높음. 먼저 실증 필요 |
| allowed URL validation | Enclave가 문서상 Central URL만 허용 | VV 설정 허용 또는 partner build 필요 |
| certificate/public key pinning | BF L7 proxy 불가 | L4/NAT relay 또는 VV 코드 변경 필요 |

Network whitelisting 문서는 Enclave public IP를 VV에 제출하고, VV Central IP를 방화벽에서 허용하라고 한다. 이때 domain name이 지원되지 않는다는 설명은 "화이트리스트 등록 식별자"가 IP라는 뜻이지, Enclave의 API endpoint 설정이 IP만 가능하다는 뜻은 아니다.

### 선택지 평가

| 선택지 | 설명 | 장점 | 리스크 | 권고 |
|---|---|---|---|---|
| Network-wrapped original Enclave | FI/VASP DMZ에 원형 Enclave를 두고 BF가 전용선/IPSec/NAT/L7 proxy/관제를 제공 | VV 코드 변경 최소, E2EE 논리 보존, 빠른 PoC | 금융기관이 Docker/DB/블랙박스를 여전히 수용해야 함 | 단기 1순위 |
| BF-managed original Enclave | BF 국내 gateway에 VASP별 원형 Enclave를 운영 | VASP 설치 부담 최소, 출시 빠름 | BF가 평문 PII processor가 됨, 은행 심사 부담 | 비은행/소형 VASP fallback |
| Split Enclave | FI/VASP에는 Thin Crypto Agent, BF에는 Central Connector/Gateway | BF 평문 비열람 + 금융기관 망분리 대응 + Docker 부담 최소 | VV 제품 변경, 보안검증/인증/릴리즈 필요 | 중장기 목표 |
| Pure relay without Enclave changes | BF가 Central inbound/outbound만 전달하고 Enclave는 원형 유지 | 구현 쉬움 | Enclave 설치 문제는 해결하지 못함 | Network-wrapped original Enclave의 일부 |

### 최종 판단

당장 "Enclave를 분리해서 간다"를 1차 구현안으로 잡으면 VV core 제품 변경, 프로토콜 호환성, counterparty 신뢰, 키관리 책임이 모두 새로 생긴다. 따라서 1차 시장진입은 `원형 Enclave + BF 네트워크/보안 게이트웨이 래핑`이 낫다.

다만 한국 금융기관의 장기 target architecture는 `Split Enclave`가 더 좋다. 이유는 다음과 같다.

1. 평문 PII와 private key를 FI/VASP 통제구역에 남길 수 있다.
2. BF는 망분리, 전용선, VV Central 통신, audit, retry, SLA만 담당할 수 있다.
3. 금융기관이 closed-source Docker 전체를 받아야 하는 부담을 줄인다.
4. "BF는 평문을 보지 않는다"는 설명이 다시 가능해진다.

따라서 권장 로드맵은 다음과 같다.

1. `VEGA_API_ENDPOINT`를 BF L7 proxy로 지정 가능한지 실증한다.
2. 가능하면 원형 Enclave를 FI/VASP DMZ에 두고 BF가 Central 통신을 감싸는 PoC를 먼저 한다.
3. VASP가 Docker를 못 받는 경우에만 VASP별 BF-managed Enclave를 제한적으로 제공한다.
4. VV에는 별도 제품 요구사항으로 `VVxBF Financial Gateway Edition = Thin Crypto Agent + BF Central Connector`를 제안한다.
5. 영업자료에는 1차 현실안과 2차 목표안을 분리한다. 단기안은 "BF가 망분리/통신을 해결", 장기안은 "BF는 평문 비열람 gateway"로 포지셔닝한다.

## 7. 국내 구축 옵션 비교

### 옵션 A. 보난자 IDC 기반 managed gateway

가장 권장되는 시작점이다.

장점:

- 기존 TranSafer/VAN형 금융기관 연계 경험과 잘 맞음
- 금융기관은 기존 외부기관 연계 모델로 심사 가능
- VV enclave가 은행 내부망에 들어가지 않음
- 국내 물리 위치, 운영자, 로그, 관제, 장애 대응 명확
- 전용선/폐쇄망 연결 설계가 쉬움

유의점:

- 보난자는 금융기관별 수탁자 또는 전자금융보조업자 역할을 명확히 해야 함
- 자체 IDC 보안, DR, 접근통제, 취약점 관리, 관제 수준을 은행 심사 수준으로 문서화해야 함
- VV가 보난자에게 소스/이미지/운영권한/지원권한을 충분히 제공해야 함

### 옵션 B. 국내 클라우드 기반 gateway

두 번째 권장안이다. 국내 리전, 전용회선 연결, 전용 VPC/VNet, private endpoint, HSM/KMS, SIEM 연계가 가능한 환경을 전제로 한다.

장점:

- 빠른 확장, DR, IaC, 표준화에 유리
- 기관별 tenant 분리 자동화 가능
- 금융권 클라우드 이용 가이드에 맞춰 절차화 가능

유의점:

- 금융기관이 보난자 서비스를 자기 업무의 정보처리 위탁 또는 클라우드 이용으로 보는 경우, 중요도 평가, CSP 평가, BCP/안전성 확보조치, 정보보호위원회, 금융감독원 보고 패키지가 필요
- 고유식별정보 또는 개인신용정보 처리 가능성이 있으면 국내 설치와 접근통제가 중요
- 해외 CSP라도 국내 리전, 데이터 위치, 운영자 접근, support access, 국외 이전 여부를 세밀하게 검토해야 함

### 옵션 C. 은행 내부 또는 은행 클라우드에 VV enclave 설치

비권장 또는 최후 옵션이다.

가능하려면 다음 조건이 모두 필요하다.

- 소스/이미지 검증 패키지 제공
- 은행 change management에 맞춘 업데이트 통제
- enclave outbound endpoint 고정 및 firewall allowlist
- 내부망이 아닌 DMZ 또는 외부연계망 배치
- 은행 HSM/KMS 연계
- vendor remote access 금지 또는 JIT 통제
- 은행 보안성심의와 정보보호위원회 승인

이 모델은 각 은행이 매번 VV enclave를 직접 심사해야 하므로 사업 확장성이 떨어진다.

### 옵션 D. 은행이 VV 해외 서비스에 직접 연결

현실적으로 가장 어렵다.

문제점:

- 내부망에서 해외 SaaS/API 직접 사용으로 보일 수 있음
- 생산계 고객/거래정보 처리 시 2026 SaaS 예외 논리와 맞지 않음
- 국외 정보처리 위탁, 개인정보 국외이전, 감독권·감사권 확보 이슈가 커짐
- VV enclave 또는 API stack의 블랙박스 심사를 은행이 직접 수행해야 함
- VASP 중심 onboarding/DD와 은행·전자금융업자 지위가 맞지 않을 수 있음
- 사고 시 책임 소재가 은행, VV, cloud, counterparty VASP로 분산됨

보난자 게이트웨이가 없으면 각 금융기관은 이 문제를 개별 해결해야 한다. 이 자체가 국내 게이트웨이 사업의 핵심 진입장벽이자 가치다.

## 8. 보난자 게이트웨이의 법적·운영상 포지션

### 8.1 권장 포지션

보난자팩토리는 다음 세 가지 역할을 결합해 설명하는 것이 좋다.

1. VV 공식 국내 구축 파트너
2. 금융기관 외부연계/VAN형 managed gateway 사업자
3. TranSight KYT와 Travel Rule/VerifyName을 결합한 디지털자산 컴플라이언스 게이트웨이

금융기관에 대한 메시지는 다음이 좋다.

```text
금융기관이 해외 VV 서비스 또는 opaque Docker enclave를 직접 도입하지 않아도 됩니다.
보난자가 국내 통제 환경에 VV gateway를 구축하고, 금융기관은 기존 VAN형 보안채널로 연결합니다.
PII payload는 최종 수신자 공개키로 암호화되어 게이트웨이는 평문을 보지 않고,
게이트웨이는 KYT, 라우팅, 감사증적, 장애 대응, 국내 규제 대응을 수행합니다.
```

### 8.2 계약 구조

권장 계약 구조:

- 금융기관 ↔ 보난자: 국내 게이트웨이 이용계약, 정보처리 위탁/전자금융보조업자 책임, SLA, 감사권, 사고통지, 재위탁 승인
- 보난자 ↔ VV: 국내 구축 파트너 계약, 소스/이미지 검증권, 운영지원권, 보안패치 SLA, 데이터 접근 제한, 재위탁/지원 범위
- 보난자 ↔ cloud/IDC: 국내 데이터 위치, 접근통제, 로그, DR, 보안관제, 침해사고 대응
- 금융기관 ↔ VV: 필요 시 network/legal recognition 또는 beneficiary/counterparty due diligence를 위한 간접 동의 구조

### 8.3 책임 경계

| 주체 | 책임 |
|---|---|
| 금융기관 | 고객 동의/법적 근거, KYC 원천 데이터 정확성, 출금 승인, 내부 AML 정책 |
| 보난자 | 게이트웨이 보안, 채널 보안, KYT, routing, audit, 장애 대응, 국내 위탁 통제 |
| VV | VV protocol, enclave/software, network membership, counterparty discovery, VerifyName/TravelRule service |
| 수신 VASP | 수신자 확인, payload 복호화, 수취 고객 정보 검증, 수신 거절/승인 |
| CSP/IDC | 인프라 가용성, 물리/기반 보안, 계약상 보안통제 |

## 9. 금융기관 직접 VV 이용의 한계

보난자 게이트웨이가 없을 때 한국 금융기관이 VV 서비스를 직접 구축·이용하는 데 생기는 한계는 다음과 같다.

### 9.1 망분리와 외부통신 문제

은행 내부 업무망에서 VV Central 또는 해외 API로 직접 outbound 통신하는 구조는 전자금융감독규정 제15조의 망분리 원칙과 충돌 소지가 크다. DMZ에 enclave를 놓더라도 내부 KYC/계정 시스템과 연계해야 하므로 망간 연계, 파일/API 중계, 무결성 검증, 접근통제, 로그, 보안성심의가 필요하다.

보난자 게이트웨이는 은행 내부망의 직접 인터넷 연결 문제를 없애고, 기존 외부기관 연계망 구조로 환원한다.

### 9.2 해외 클라우드·국외 위탁 문제

VV 본사 또는 VV가 운영하는 해외 인프라가 End User Data, verification metadata, callback, account verification data를 처리하는 구조라면 금융기관은 국외 이전, 국외 정보처리 위탁, 감독기관 실질 감독 가능성, 고객 고지/동의 또는 법적 근거를 모두 검토해야 한다.

보난자 게이트웨이는 국내에서 데이터 최소화와 로그 보존을 수행하고, VV로 나가는 데이터 범위를 암호문·최소 metadata로 제한하는 통제 지점을 제공한다.

### 9.3 블랙박스 enclave 심사 문제

VV enclave가 source 비공개 Docker image로 은행 환경에 배포되면 은행은 다음을 직접 입증해야 한다.

- 이미지가 어떤 코드를 실행하는지
- 어떤 endpoint와 통신하는지
- 어떤 로그와 cache를 남기는지
- key와 token이 어디 저장되는지
- vendor가 원격으로 접근할 수 있는지
- 업데이트가 누가 언제 반영하는지

보난자 게이트웨이는 이를 한 번의 공통 통제 패키지로 표준화해 여러 금융기관에 반복 적용할 수 있다.

### 9.4 VASP 중심 네트워크와 금융기관 지위 불일치

VV Travel Rule API는 Travel Rule-obliged VASP를 주 고객으로 설계되어 있고, VV 약관상 Licensee/End User/VASP 개념도 VASP 또는 obliged entity 중심이다. 은행·전자금융업자가 아직 가상자산사업자로 신고된 주체가 아니거나, 특정 서비스에서만 디지털자산을 다루는 경우 VV 멤버십, due diligence, counterparty recognition 구조가 애매해질 수 있다.

보난자 게이트웨이는 국내 금융기관을 VV network에 직접 노출시키는 대신, 금융기관용 protocol facade와 legal/technical onboarding 창구가 된다.

### 9.5 감사증적·사고대응 분산

직접 연결하면 거래 실패, 오탐, mismatch, 지연, data breach, key incident 발생 시 원인 분석이 은행, VV, CSP, counterparty VASP 사이에 흩어진다.

게이트웨이는 다음 감사 타임라인을 국내에서 단일화한다.

```text
금융기관 요청
  -> 채널 인증
  -> KYT result
  -> VV/VerifyName request ID
  -> counterparty response
  -> transfer decision
  -> TXID/result
  -> 보존/검색/감사
```

## 10. 구현 원칙

### 10.1 네트워크

- 금융기관 내부망과 게이트웨이는 직접 붙이지 않고, DMZ/EAI/외부연계망을 둔다.
- production 기본 채널은 전용선 또는 폐쇄형 IP-VPN으로 제안한다.
- IPSec VPN은 보안대책과 정보보호위원회 승인 하에 생산계 옵션으로 둔다.
- mTLS only는 PoC, sandbox, backup channel부터 시작한다.
- 게이트웨이 outbound는 allowlist 기반으로 제한한다.
- VV Central/API, counterparty VASP, 보안관제 endpoint를 구분한 egress policy를 둔다.

### 10.2 암호화와 키

- IVMS101/End User Data는 수신기관 공개키로 E2E 암호화한다.
- 보난자 게이트웨이는 payload 평문을 보지 않는 것을 원칙으로 한다.
- gateway signing key, channel cert, VV API key, webhook secret는 tenant별 분리한다.
- 가능하면 HSM 또는 cloud HSM/KMS를 사용하고, key export를 금지한다.
- key rotation, revocation, emergency disable runbook을 금융기관별로 문서화한다.

### 10.3 데이터 최소화

- payload 원문 미저장
- request/response body 로그 금지
- payload hash, verification ID, transfer state, error code만 저장
- 지갑주소는 원문 필요 구간 외 hash/token 병행 저장
- 보존기간은 법정 보존, AML 감사, 계약상 SLA를 구분해 설계

### 10.4 운영

- 금융기관별 tenant config는 승인 workflow 없이는 변경 불가
- VV image update는 change ticket, 영향도 평가, rollback plan 필수
- 보안관제는 gateway, container runtime, network egress, admin access, failed auth를 모두 수집
- 장애 시 fail-closed 원칙을 기본으로 하되, 금융기관 정책에 따라 manual review 상태를 둘 수 있음
- KYT BLOCK이면 TR/VV payload를 relay하지 않는 Atomic Gate 원칙 유지

## 11. 금융기관 제출용 패키지

보난자가 영업/심사 단계에서 준비해야 할 산출물:

1. 서비스 개요서
2. 데이터 흐름도
3. 망 구성도
4. 개인정보/개인신용정보 처리목록
5. 암호화 및 키 관리 정책
6. VV enclave 소스/이미지 검증 보고서
7. SBOM 및 취약점 진단 결과
8. 침투테스트 및 모의해킹 결과
9. 운영 접근권한 관리표
10. 로그 보존 및 감사증적 설계
11. 장애·DR·BCP 계획
12. 침해사고 대응 및 통지 절차
13. 재위탁 현황 및 CSP/IDC 보안자료
14. 금융감독원 보고/정보보호위원회 안건 초안
15. 고객 동의/고지 및 개인정보 국외이전 검토 체크리스트

## 12. 의사결정 권고

### 12.1 우선순위

1. 보난자 IDC 또는 국내 클라우드에 VV Gateway reference environment 구축
2. VV와 source review, image signing, update control, support access 관련 계약 조항 확정
3. 은행 1곳 기준 보안성심의 패키지 작성
4. 전용선/IP-VPN 연결 모델로 1차 PoC
5. IPSec/mTLS 모델은 인터넷전문은행·전자금융업자 대상으로 병행 검증
6. 내부 TranSight KYT Atomic Gate와 VV TravelRule/VerifyName flow 통합
7. 로그/감사증적을 금융기관 화면 또는 report로 제공

### 12.2 피해야 할 설명

- "PII가 암호화되어 있으니 개인정보가 아니다"
- "망분리 완화로 해외 SaaS를 바로 쓰면 된다"
- "Docker enclave는 VV가 주는 것이니 은행이 그냥 설치하면 된다"
- "전용선은 필요 없다"
- "VV가 복호화 못 하므로 모든 규제 이슈가 사라진다"

### 12.3 써야 할 설명

- "게이트웨이는 평문 PII 비열람 구조이지만 암호문과 metadata도 보호대상으로 통제한다"
- "금융기관 내부망은 VV 해외망과 직접 통신하지 않고, 국내 외부연계 구간으로만 연결한다"
- "전용선, 폐쇄형 IP-VPN, IPSec VPN, mTLS를 기관 위험평가와 정보보호위원회 승인 수준에 맞춰 선택한다"
- "VV enclave는 소스/이미지/운영통제 검증을 거쳐 국내 게이트웨이에 표준 배포한다"
- "은행이 개별적으로 VV를 심사·구축하지 않아도 되도록 국내 감사증적과 책임 경계를 제공한다"

## 13. 다음 검토 질문

1. VV가 보난자에게 제공 가능한 정확한 범위는 무엇인가: source review, source escrow, build permission, image signing, support access, audit report.
2. VV Central/API로 실제 전송되는 metadata 목록은 무엇인가.
3. VerifyName은 Travel Rule-obliged transfer 외에 어떤 법적 근거와 고객 동의/고지로 사용할 것인가.
4. 금융기관이 보난자 gateway 이용을 정보처리 위탁으로 볼 때 표준 계약서와 보고 패키지는 무엇인가.
5. 국내 클라우드 사용 시 CSP는 누구이며, tenant별 data residency와 support access 통제는 어떻게 증명할 것인가.
6. 기존 TranSafer 전용선망을 그대로 활용할 수 있는 은행과 신규 IPSec/mTLS가 필요한 기관을 구분해야 한다.

## 14. 참고 근거

확인 기준일: 2026-08-05 KST.

- 금융위원회, 2022-03-24, 특정금융정보법상 트래블룰 시행 보도자료: https://www.fsc.go.kr/no010101/77579
- 특정금융정보법 시행령 제10조의10, 가상자산이전 시 정보제공: https://www.law.go.kr/lumLsLinkPop.do?chrClsCd=010202&lspttninfSeq=82843
- 전자금융감독규정 제14조의2, 클라우드컴퓨팅서비스 이용절차 등, 시행 2026-02-13: https://www.law.go.kr/LSW//admRulSideInfoP.do?admRulSeq=2100000274812&chrClsCd=010201&dashNo=&docCls=jo&joBrNo=02&joNo=0014&urlMode=admRulScJoRltInfoR
- 전자금융감독규정 제15조, 해킹 등 방지대책, 시행 2026-02-13: https://www.law.go.kr/LSW//admRulSideInfoP.do?admRulSeq=2100000274812&chrClsCd=010201&dashNo=&docCls=jo&joBrNo=00&joNo=0015&urlMode=admRulScJoRltInfoR
- 금융위원회, 2024-08-13, 금융분야 망분리 개선 로드맵: https://www.fsc.go.kr/no010101/82885
- 금융위원회, 2026-04-20, 내부 업무망 SaaS 활용 관련 전자금융감독규정시행세칙 개정: https://www.fsc.go.kr/no010101/86745
- 금융보안원, 2025-05-22, 금융분야 클라우드컴퓨팅서비스 이용 가이드(2025 개정): https://www.fsec.or.kr/bbs/detail?bbsNo=11691&menuNo=222
- 금융회사의 정보처리 업무 위탁에 관한 규정: https://www.law.go.kr/admRulLsInfoP.do?admRulSeq=2100000200327
- 개인정보 포털, 개인정보의 개념: https://www.privacy.go.kr/front/contents/cntntsView.do?contsNo=27
- 개인정보 보호법 시행령 제30조, 개인정보의 안전성 확보 조치: https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lspttninfSeq=66999
- VerifyVASP Travel Rule product page: https://www.verifyvasp.com/en/products/travel-rule/
- VerifyVASP Terms of Service: https://www.verifyvasp.com/faq/terms-of-service/
- VerifyVASP enclave 설치 문서: https://docs-kr.verifyvasp.com/getting-started/install-and-run-enclave-server

## 15. 관련 내부 문서

- [[docs/TRANSIGHT_PROJECT_CONTEXT]]
- [[docs/ttr-api-specification]]
- [[docs/alliance-strategy]]
- [[docs/ko/internal/vasp-integration-cost]]
- [[AI-Sessions/wiki/projects/transight-tr-current-overview]]
- [[AI-Sessions/wiki/design/transight-tr-runtime-architecture]]

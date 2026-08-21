---
type: decision
date: 2026-08-11
status: draft
topic: Applicability of SWIFT/MT-MX external-message precedent to VV Enclave DMZ architecture
source:
  - AI-Sessions/wiki/decisions/2026-08-10-vv-no-bf-data-plane-pivot.md
  - https://www.kakaobank.com/products/foreignRemittanceReceive
  - https://community.kftc.or.kr/kftc/business/BusinessFncJoin.do
  - https://www.swift.com/standards/iso-20022/iso-20022-faqs/implementation
  - https://www.law.go.kr/LSW//admRulSideInfoP.do?admRulSeq=2100000274812&chrClsCd=010201&dashNo=&docCls=jo&joBrNo=00&joNo=0015&urlMode=admRulScJoRltInfoR
  - https://www.law.go.kr/LSW//admRulSideInfoP.do?admRulSeq=2100000274812&chrClsCd=010201&dashNo=&docCls=jo&joBrNo=00&joNo=0017&urlMode=admRulScJoRltInfoR
  - https://www.law.go.kr/LSW/admRulLsInfoP.do?admRulSeq=2200000078509
  - https://better.fsc.go.kr/fsc_new/replyCase/OpinionDetail.do?muGpNo=75&muNo=86&opinionIdx=2176&stNo=11
---

# VV 구조에 SWIFT MT/MX 전문 처리 선례를 적용할 수 있는지

## Short Answer

카카오뱅크의 "MT 전문처리 등 외부통신 선례를 적용하면 된다"는 말은 절반 정도 맞다.

맞는 부분:

- 금융회사가 모든 외부통신을 금지당하는 것은 아니다.
- SWIFT, 금융결제원, CLS, 외화자금이체처럼 업무상 필수적인 대외 금융망/특정 외부기관과의 전문 송수신은 이미 은행권에서 운영되는 선례가 있다.
- 전자금융감독규정 시행세칙에는 업무상 외부통신망 연결이 불가피한 정보처리시스템 및 DMZ 시스템과 실시간 송수신하는 내부 시스템에 대한 망분리 예외 축이 있다.

틀리거나 부족한 부분:

- SWIFT 외화전문 선례가 있다고 해서 VV 해외 클라우드/API 연결이 자동으로 동일 취급되는 것은 아니다.
- SWIFT는 전 세계 은행 간 금융메시징망이고, VV는 해외 법인이 운영하는 VASP Travel Rule network다. 규제상 신뢰도, 금융망 인정성, 계약 구조, 개인정보 국외이전, closed-source Enclave 이슈가 다르다.
- 2024-06-19 금융감독원 비조치의견은 내부망 시스템과 외부 SaaS 간 DMZ API 중계를 망분리 위반으로 본 사례가 있다. VV가 "특정 외부 금융기관 전문망"이 아니라 "외부 SaaS"로 분류되면 위험하다.

따라서 결론은 `동일 적용 가능`이 아니라 `SWIFT/외화전문 선례를 근거로 한 FI DMZ 대외계 모델은 설계 가능하지만, VV의 성격을 특정 외부 금융망/전자금융업무 연계로 분류하고 별도 보안·법무 판단을 닫아야 한다`이다.

## What MT Means Here

은행권의 `MT 전문`은 SWIFT FIN의 Message Type 기반 전문을 의미하는 것으로 보인다. 다만 SWIFT cross-border payment instruction 영역은 ISO 20022 전환으로 `MX`/`FINplus` 중심이 되었고, 2025-11-22에 CBPR+ coexistence가 종료되었다. 국내 은행 공지들도 2025-11-24부터 기존 MT 방식 송금이 중단되고 MX 방식으로만 해외송금을 신청한다고 안내했다.

따라서 외부 제안서에서는 `MT 전문`만 쓰기보다 다음 표현이 안전하다.

```text
SWIFT/ISO 20022 MX 등 외화송금 전문 처리와 유사한 금융기관 대외계 연계 모델
```

## Why The Precedent Exists

카카오뱅크는 해외계좌송금 수취정보로 `KAKAOBANK CORP`, `SWIFT CODE KAKOKR22XXX`, Citibank N.A. 중개은행 정보를 공개하고 있다. 이는 카카오뱅크가 외화송금 수취/송금 업무에서 국제 금융메시징 및 중개은행 네트워크와 연결되는 업무가 있음을 보여준다.

금융결제원은 SWIFT를 전 세계 은행 간 정보통신망으로 설명하고, 국내 금융회사의 SWIFT network 이용 관련 정보 제공, 교육, 국내 정회원그룹 사무국 기능을 수행한다고 밝힌다. 또한 CLS/외환동시결제 예시에서는 MT300, MT396 같은 전문 흐름이 등장한다.

즉 카카오뱅크의 말은 "은행 내부 시스템이 DMZ/대외계/전문중계 시스템을 통해 특정 외부 금융망과 전문을 주고받는 운영 선례가 있다"는 뜻으로 이해하는 것이 합리적이다.

## Regulatory Hook

전자금융감독규정 제15조는 내부통신망과 연결된 내부 업무용 시스템의 외부통신망 접속을 원칙적으로 금지한다. 다만 업무상 불가피하고 금융감독원장의 확인을 받은 경우 등 예외를 둔다.

전자금융감독규정 시행세칙 제2조의2 제2항 제2호는 업무상 외부통신망과 연결이 불가피한 정보처리시스템을 예외 축으로 본다. 대표적으로:

- 전자금융업무 처리를 위해 특정 외부기관과 데이터를 송수신하는 정보처리시스템
- DMZ구간 내 정보처리시스템과 실시간으로 데이터를 송수신하는 내부통신망의 정보처리시스템

전자금융감독규정 제17조는 DMZ구간을 내부통신망과 외부통신망 사이의 독립된 통신망으로 보고, 공개용 서버는 DMZ에 설치하고 접근제어를 해야 하며, DMZ 내 이용자 정보 등 주요정보 저장을 제한한다. 거래로그 저장은 예외가 될 수 있으나 고유식별정보는 암호화하고 그 외 이용자 정보도 별도 보안대책이 필요하다.

## Applicability To VV

### Strong Version

VV Enclave가 다음처럼 설계되면 SWIFT/외화전문 선례와 비교적 가까워진다.

```text
FI Internal/Core
  -> controlled internal API/EAI
  -> FI DMZ 대외계 zone
  -> FI-hosted VV Enclave
  -> fixed VV Central endpoint only
  -> VerifyVASP network/counterparty VASP
```

조건:

- BF IDC 또는 BF proxy를 data path에서 제거한다.
- VV Central을 특정 외부기관 또는 특정 금융메시징 network로 정의한다.
- 통신 목적을 전자금융업무 또는 그에 준하는 Travel Rule/AML/CFT 필수 업무로 정리한다.
- 목적지 IP/domain/port를 고정 allowlist한다.
- Enclave는 FI DMZ에 둔다.
- 내부망과 DMZ 간 API는 최소 필드, 단방향성 또는 요청/응답 제한, 전문 schema validation, malware/DLP 통제, 암호화 전송을 적용한다.
- DMZ에는 주요정보 원문을 저장하지 않는다. Enclave DB가 필요하면 encrypted, TTL, key externalization, internal KMS/HSM 연계를 설계한다.

### Weak Version

다음처럼 설명되면 2024-06-19 SaaS 비조치의견과 유사한 위험이 생긴다.

```text
FI internal system
  -> DMZ web/API relay
  -> overseas SaaS/cloud API
  -> customer-personalized processing
```

이 경우 금융감독원은 DMZ 중계를 내부망과 외부 SaaS 간 실시간 통신으로 볼 수 있고, 업무상 불가피한 예외가 아니라고 판단할 수 있다.

## Differences Between SWIFT And VV

| 항목 | SWIFT/외화전문 | VerifyVASP |
|---|---|---|
| 네트워크 성격 | 은행 간 국제 금융메시징망 | VASP Travel Rule network |
| 국내 운영 선례 | 매우 많음 | 은행 직접 도입 선례 제한적 |
| 메시지 표준 | MT, 현재는 ISO 20022 MX/FINplus 중심 | IVMS101 및 VV proprietary API |
| 법적 업무 | 외국환/지급결제 본업 | 가상자산 Travel Rule/AML 보조 또는 연계 업무 |
| 상대방 | 은행, 중개은행, 금융결제 인프라 | 해외 VASP, VV Central, counterparty Enclave |
| 소프트웨어 | SWIFT stack 및 은행 대외계 | VV closed-source Docker Enclave |
| 개인정보/신용정보 | 송금인/수취인/계좌/주소 등 포함 | 송수신인 PII, 지갑주소, 거래정보 포함 |
| 국내 분류 가능성 | 특정 외부 금융기관/금융망 | 특정 외부기관일 수 있으나 SaaS로 오해될 위험 |

## Recommendation

카카오뱅크의 선례 주장은 설계 방향을 지지하는 근거로 쓸 수 있다. 하지만 "그대로 적용하면 문제 없음"이라고 말하면 안 된다.

권장 문구:

```text
본 구조는 일반 인터넷 SaaS 이용이 아니라,
외화송금 SWIFT/ISO 20022 전문 처리와 유사한 금융기관 대외계 연계 모델로 설계한다.
금융기관 DMZ 내 VV Enclave를 대외 전문처리 시스템으로 배치하고,
특정 VV Central endpoint와 필요한 port만 허용하여 Travel Rule/AML 목적의 표준화된 전문을 송수신한다.
다만 VV network가 SWIFT와 동일한 규제상 지위를 갖는 것은 아니므로,
금융기관 CISO/준법/개인정보 부서의 분류와 필요 시 금융감독원 확인을 전제로 한다.
```

## Questions For KakaoBank

1. 말한 `MT 전문처리` 선례가 정확히 SWIFT Alliance/FINplus, Citibank 중개은행, 금융결제원 외화자금이체, WU 중 어느 범위인가.
2. 해당 선례에서 내부망 -> DMZ -> 외부기관 통신에 대해 적용한 법적 근거가 시행세칙 제2조의2 제2항 제2호인지, 별도 비조치의견/내부 법무의견이 있는지.
3. 해당 선례가 이용자 고유식별정보 또는 개인신용정보를 포함했는지.
4. 해당 선례에서 DMZ에 원문 고객정보 또는 전문 payload를 저장했는지, 아니면 전문 relay/log만 처리했는지.
5. VV Central을 `특정 외부기관`으로 볼 수 있다고 내부적으로 판단하는지.
6. VV Enclave DB를 DMZ에 두는 것을 허용하는지, 아니면 DB/key/log는 내부 보호구간에 둬야 하는지.
7. 기존 외화전문 보안통제 checklist를 VV Enclave에 적용할 수 있는지.


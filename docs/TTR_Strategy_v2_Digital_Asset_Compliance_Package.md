# TTR Strategy v2  
## 디지털 자산 유통을 위한 컴플라이언스 패키지 전략 문서

---

## 1. Executive Summary

TTR은 기존 CODEVASP와 유사한 Travel Rule 솔루션 구조를 기반으로 출발했으나, 향후 단순 Travel Rule 메시징 솔루션을 넘어 **디지털 자산 유통을 위한 컴플라이언스 패키지**로 고도화한다.

이 패키지는 국내 금융기관, 스테이블코인 발행사, 수탁기관, 결제사업자, VASP가 디지털 자산을 발행·유통·송수신할 때 필요한 핵심 컴플라이언스 기능을 통합 제공하는 것을 목표로 한다.

핵심 구성은 다음과 같다.

```text
Digital Asset Compliance Package
= TranSight KYT + TTR Travel Rule Bridge + PII Verification + VASP Connectivity + Audit Evidence
```

TTR 자체는 연간 수백억 원 규모의 독립 대형 수익사업으로 보기보다는, **TranSight KYT를 국내 금융기관의 디지털 자산 유통 인프라에 빠르게 침투시키기 위한 Compliance Gateway**로 정의한다.

즉, 회사의 장기 핵심 가치는 Travel Rule 자체가 아니라, **TranSight KYT가 보유한 주소 인텔리전스, 자금흐름 분석, 위험평가 모델, 정부기관·금융기관 표준 인프라 지위**에 있다.

TTR은 그 KYT가 금융기관의 실제 업무 프로세스 안으로 들어가기 위한 **배관이자 연결 인프라**다.

---

## 2. 전략적 정의

### 2.1 기존 정의

기존 TTR은 다음과 같이 정의될 수 있었다.

```text
TTR = Travel Rule Solution
```

그러나 이 정의는 너무 좁다. Travel Rule만으로는 금융기관의 디지털 자산 유통 니즈를 충분히 설명하지 못하고, 사업적 확장성도 제한적이다.

### 2.2 v2 정의

v2부터 TTR은 다음과 같이 정의한다.

```text
TTR = 디지털 자산 유통을 위한 컴플라이언스 게이트웨이
```

또는 패키지 관점에서는 다음과 같다.

```text
TranSight + TTR = Digital Asset Compliance Package
```

이 패키지는 다음 문제를 해결한다.

```text
1. 디지털 자산 송수신 전 지갑·거래 위험평가
2. Travel Rule 적용 여부 판단
3. 국내외 VASP 계정주 확인
4. 송수신인 정보 제공 및 보관
5. PII 암호화 및 비열람 구조
6. 국내 VASP 직접 연동
7. 해외 VASP 연결성 확보
8. 감사증적 및 규제 대응 로그 관리
9. STR 후보 탐지 및 보고 지원
10. 금융기관 망분리·보안 환경 대응
```

---

## 3. 핵심 철학

### 3.1 TR은 목적이 아니라 온보딩 수단이다

Travel Rule은 금융기관과 VASP가 디지털 자산을 유통하기 위해 반드시 갖춰야 하는 규제 기능이다. 하지만 고객 입장에서 TR은 고부가가치 인텔리전스라기보다는 “반드시 해야 하는 컴플라이언스 체크박스”에 가깝다.

따라서 TTR 자체를 대형 수익사업으로 기대하기보다는, **TranSight KYT의 온보딩 장벽을 낮추는 보완 인프라**로 본다.

```text
TR = Compliance Plumbing
KYT = Intelligence Layer
```

회사는 TR 배관을 제공함으로써, 그 위에 흐르는 KYT 인텔리전스를 금융기관 업무 표준으로 만든다.

### 3.2 진짜 IP는 KYT다

TranSight KYT는 다음과 같은 핵심 IP를 보유한다.

```text
1. 위험 주소 데이터베이스
2. 범죄·제재·사기 관련 주소 인텔리전스
3. 자금흐름 추적 알고리즘
4. 국내 수사기관·금융기관 업무에 맞춘 분석 모델
5. STR/조사/감사 판단 근거
6. 국가 단위 디지털 자산 감시 인프라로의 확장 가능성
```

반면 Travel Rule은 프로토콜, 연동, 상태관리, 운영비용의 비중이 크고 수익성은 제한적일 수 있다.

따라서 전략적 우선순위는 명확하다.

```text
1순위: TranSight KYT를 금융기관·정부기관 표준 인프라로 만든다.
2순위: TTR을 통해 KYT 도입을 쉽게 만든다.
3순위: TR 자체는 적자를 내지 않는 수준에서 인프라 가치를 확보한다.
```

---

## 4. 시장 배경

국내 금융기관이 스테이블코인 또는 디지털 자산 유통에 참여하려면 단순 지갑 시스템만으로는 부족하다.

필수적으로 다음 세 가지가 필요하다.

```text
1. KYT
- 지갑 위험평가
- 거래 위험평가
- 제재/범죄/고위험 주소 식별
- 자금흐름 추적
- STR 후보 탐지

2. Travel Rule / PII Verification
- 송신인·수신인 정보 제공
- 계정주 확인
- 국내외 VASP 간 정보교환
- 정보 보관 및 감사증적

3. Compliance Operation
- 거래 승인/보류/거절
- 수동심사
- 금융당국 대응
- 내부감사 대응
- 리스크 정책 관리
```

따라서 금융기관이 원하는 것은 단일 기능이 아니라, 디지털 자산 유통을 가능하게 하는 통합 컴플라이언스 패키지다.

TTR v2는 이 요구에 맞춰 설계된다.

---

## 5. 제품 포지셔닝

### 5.1 한 줄 정의

```text
TTR은 국내 금융기관·국내 VASP·해외 VASP를 연결하는 디지털 자산 유통 컴플라이언스 브릿지다.
```

### 5.2 패키지 정의

```text
Digital Asset Compliance Package
= TranSight KYT + TTR Travel Rule Bridge + PII Verification + Domestic/Global VASP Connectivity
```

### 5.3 영문 표현

```text
TTR is a Digital Asset Compliance Gateway connecting Korean financial institutions, domestic VASPs, and global VASPs through KYT, Travel Rule, PII Verification, and audit-ready compliance infrastructure.
```

---

## 6. TTR의 역할

TTR은 다음 네 가지 역할을 동시에 수행한다.

### 6.1 Domestic TR Bridge

국내 금융기관과 국내 핵심 VASP를 직접 연결한다.

```text
- Upbit Direct Adapter
- Bithumb Direct Adapter
- 향후 Coinone, Korbit, Gopax 등 확장 가능
```

목적은 다음과 같다.

```text
1. 국내 금융기관 ↔ 국내 VASP 간 계정주 확인
2. 국내 특금법 기준 Travel Rule 대응
3. 입출금 주소 확인
4. 송수신인 정보 제공 및 보관
5. KYT 위험평가 연계
6. 스테이블코인 국내 유통망 확보
```

### 6.2 Global TR Router

초기에는 GTR Direct를 메인 외부 Travel Rule Adapter로 사용한다.

```text
- GTR Direct Adapter
- 향후 Notabene Adapter
- 향후 Sumsub / TRP / 기타 provider bridge
- Manual / Out-of-Network fallback
```

GTR은 초기 해외 주요 VASP 커버리지 확보를 위한 bootstrap rail이다.

### 6.3 PII Verification Hub

국내 금융기관이 해외 VASP로 디지털 자산을 송금할 때, 본인 계정 송금 또는 수취인 확인을 지원한다.

```text
- 이름 match
- 생년월일 match
- 법인명 match
- 주소 소유 확인
- 수취 VASP 계정 확인
- match / mismatch / pending / unavailable 상태 관리
```

### 6.4 Stablecoin Compliance Gateway

TranSight KYT와 결합해, 스테이블코인 유통에 필요한 준법 게이트웨이를 제공한다.

```text
- KYT risk score
- sanctions / scam / crime exposure
- Travel Rule decision
- PII Verification result
- approval / hold / reject recommendation
- audit trail
- STR candidate generation
```

---

## 7. GTR Direct 전략

### 7.1 GTR의 역할

GTR Direct는 TTR의 초기 글로벌 커버리지 확보용 메인 외부 Adapter로 활용한다.

다만 GTR은 TTR의 최종 네트워크가 아니라, 다음 역할을 수행하는 bootstrap rail이다.

```text
1. 초기 해외 주요 VASP 커버리지 확보
2. 금융기관 PoC 및 초기 영업용 실사용 rail
3. Binance, Bybit, Bitget, OKX 등 직접 협의 전 연결성 확보
4. TTR Direct 전환 전 bridge
5. 일부 VASP에 대한 장기 fallback rail
```

### 7.2 전략 문구

```text
TTR은 초기 해외 VASP 커버리지 확보를 위해 GTR Direct를 메인 외부 TR Adapter로 활용한다. 다만 GTR은 TTR Network 구축 전 단계의 bootstrap rail이며, 국내 금융기관 고객이 온보딩되기 시작하면 업비트·빗썸 등 국내 핵심 VASP와 직접 연결하고, Bybit을 시작으로 해외 주요 VASP와의 direct rail을 확대한다.
```

### 7.3 주의사항

GTR 네트워크에 특정 VASP가 참여하고 있다는 사실과, 해당 VASP가 모든 PII Verification field를 지원한다는 것은 다르다.

따라서 운영 전 반드시 다음을 확인해야 한다.

```text
1. 각 VASP의 GTR VASP Code
2. pre-transaction verification 지원 여부
3. post-transaction verification 지원 여부
4. name / DOB / legal name / national ID 지원 여부
5. address ownership 확인 가능 여부
6. timeout / retry / SLA
7. mismatch / partial match / unavailable 응답 코드
8. 한국 금융기관의 본인 송금 확인 용도로 사용 가능한지 여부
```

---

## 8. 국내 VASP 직접 연동 전략

국내에서는 업비트와 빗썸을 핵심 직접 연동 대상으로 한다.

국내 금융기관이 디지털 자산 또는 스테이블코인을 유통하려면 국내 원화권 유동성 및 대형 VASP와의 연결성이 중요하다. 따라서 업비트·빗썸과의 직접 연결은 TTR의 핵심 전략 자산이다.

```text
Domestic Direct Rail
- Upbit Direct Adapter
- Bithumb Direct Adapter
- 향후 Coinone / Korbit / Gopax 확장 가능
```

국내 직접 연동은 TTR이 단순 외부 TR adapter가 아니라, 국내 디지털 자산 유통 인프라의 일부가 되도록 만든다.

---

## 9. 해외 VASP 직접 연동 전략

### 9.1 Bybit Direct Rail

Bybit은 이미 협의가 완료된 전략적 직접 연동 파트너로 본다.

Bybit Direct Rail은 GTR 경유 연결과 별개의 전략 자산이다.

```text
Bybit Direct Rail
- PII Verification
- 계정주 확인
- 주소 소유 확인
- Travel Rule metadata exchange
- 향후 RFI / Freeze / IAAN 연계
- 한국 금융기관 특화 정책 대응
```

Bybit Direct는 다음 의미를 가진다.

```text
GTR = 표준 커버리지 확보용 rail
Bybit Direct = 전략적 심화 협력 rail
```

### 9.2 기타 해외 VASP

다른 해외 VASP에 대해서는 처음부터 TTR Direct 가입을 강요하지 않는다.

해외 VASP가 이미 사용하는 TR 솔루션이 있다면, TTR이 해당 솔루션과 맞춰주는 Provider Bridge 방식을 우선 제공한다.

---

## 10. 해외 VASP 연결 옵션

해외 VASP에게는 세 가지 연결 옵션을 제공한다.

### Option A. Existing Provider Bridge

해외 VASP가 이미 Notabene, GTR, Sumsub, Sygna, TRP 등 기존 TR 솔루션을 쓰는 경우, TTR이 해당 provider의 포맷과 암호화 규격에 맞춰 메시지를 변환·중계한다.

```text
TTR → Provider Adapter → 해외 VASP의 기존 TR 솔루션 → 해외 VASP
```

영업 메시지:

```text
귀사가 이미 사용 중인 Travel Rule 솔루션을 변경할 필요 없습니다. TTR이 귀사의 기존 TR rail에 맞춰 한국 금융기관과의 연결성을 제공합니다.
```

### Option B. TTR Direct Lightweight API

해외 VASP가 직접 연동 의지가 있으면, 처음에는 Full TR이 아니라 경량 PII Verification API부터 제공한다.

```text
TTR → Overseas VASP Direct API
```

초기 기능:

```text
1. 수취 주소가 해당 VASP 소유인지 확인
2. 수취 고객명 match
3. 생년월일 match
4. 법인명 match
5. match / mismatch / pending / unavailable 반환
```

### Option C. TTR Network Member

금융기관 고객이 충분히 온보딩되고, TTR이 한국 디지털 자산 유통 인프라로 자리 잡으면 해외 VASP에게 TTR Network Member 참여를 제안한다.

이 단계에서 해외 VASP가 TTR에 직접 붙는 이유는 “TR 솔루션 하나 더 쓰기 위해서”가 아니라, **한국 금융기관 디지털 자산 네트워크에 접근하기 위해서**가 된다.

---

## 11. 제품 아키텍처

```text
[Domestic Financial Institutions]
 Banks / Pay / Stablecoin Issuers / Custodians
                 │
                 ▼
              [TTR Core]
 ┌────────────────────────────────────┐
 │ - Tenant / Institution Management   │
 │ - Travel Rule Rule Engine           │
 │ - PII Verification Orchestrator     │
 │ - IVMS101 Normalizer                │
 │ - Encryption / Key Policy Layer     │
 │ - KYT Risk Engine Integration       │
 │ - Audit Evidence / Logs             │
 │ - Status & Webhook Manager          │
 └────────────────────────────────────┘
                 │
 ┌───────────────┼────────────────────┐
 ▼               ▼                    ▼
Domestic       Global Bootstrap       Direct VASP
Direct Rail    / Provider Bridge      Network
                 │                    │
Upbit          GTR                  Bybit Direct
Bithumb        Notabene             Binance Direct later
Coinone        Sumsub/TRP           Bitget Direct later
Korbit         OON                  OKX Direct later
```

---

## 12. TTR Core 설계 원칙

TTR Core는 특정 provider에 종속되면 안 된다.

GTR Direct는 첫 번째 글로벌 외부 adapter로 구현하되, business logic은 GTR에 결합하지 않는다.

### 12.1 Core Principles

```text
1. Do not hard-code provider-specific logic into TTR Core.
2. All provider integrations must be implemented as adapters.
3. TTR Core must normalize all request/response data.
4. Provider-specific raw payloads must be stored separately.
5. PII plaintext handling must be minimized.
6. Encrypted payload routing must be supported.
7. Institution-specific policy rules must be configurable.
8. Domestic regulation rules must be separated from provider logic.
9. KYT decisioning must be integrated before final approval.
10. Audit logs must preserve full decision trace.
```

### 12.2 Internal Common Model

TTR은 내부 공통 모델을 가져야 한다.

```text
- Institution
- Tenant
- VASPProfile
- WalletAddress
- TravelRuleRequest
- VerificationRequest
- PIIProfile
- IVMS101Profile
- AddressOwnership
- ProviderMessage
- ProviderRawRequest
- ProviderRawResponse
- NormalizedVerificationResult
- KYTRiskResult
- ComplianceDecision
- AuditLog
```

---

## 13. Provider Router 정책

초기 routing rule은 다음과 같이 설계한다.

```text
1. Counterparty = Upbit
   → Upbit Direct Adapter

2. Counterparty = Bithumb
   → Bithumb Direct Adapter

3. Counterparty = Bybit
   → Bybit Direct Adapter if available
   → fallback: GTR Adapter

4. Counterparty ∈ GTR supported VASPs
   → GTR Adapter

5. Counterparty uses Notabene
   → Notabene Adapter

6. Counterparty unsupported
   → Manual / OON flow

7. Wallet type = self-hosted
   → Wallet ownership proof flow
```

향후 routing은 다음 기준을 조합해 결정한다.

```text
- counterparty VASP
- jurisdiction
- supported provider
- institution policy
- transaction amount
- asset type
- wallet type
- KYT risk score
- PII verification availability
- provider SLA
- fallback availability
```

---

## 14. 금융기관 고객 관점의 가치

TTR v2는 금융기관에게 다음 가치를 제공한다.

```text
1. TTR 단일 연동으로 국내외 VASP 대응
2. KYT + Travel Rule + PII Verification 통합
3. 국내 금융기관 망분리·보안정책 대응
4. 외부 TR provider별 개별 연동 부담 감소
5. 국내 VASP 직접 연결성 확보
6. 해외 주요 VASP 초기 커버리지 확보
7. PII 암호화 및 비열람 구조 지원
8. 감사증적 및 규제 대응 로그 제공
9. 스테이블코인 유통을 위한 준법 패키지 확보
```

고객 제안 문구:

```text
TTR은 국내 금융기관이 디지털 자산을 발행·유통·송수신할 때 필요한 KYT, Travel Rule, PII Verification, VASP Connectivity, 감사증적 관리를 통합 제공하는 디지털 자산 컴플라이언스 게이트웨이입니다. 기관은 TTR과만 연동하면 국내 핵심 VASP 및 해외 주요 VASP와의 규제 대응을 단계적으로 수행할 수 있습니다.
```

---

## 15. 비즈니스 모델

TTR은 독립적으로 높은 수익률을 목표로 하지 않는다.

권장 비즈니스 모델은 TranSight KYT 중심의 패키지 모델이다.

```text
1. TranSight KYT 주계약
- API 사용료
- Web 계정
- 모니터링
- 심층 분석
- STR/보고서 기능

2. TTR 부가 모듈
- 월 기본료
- 거래량 기반 수수료
- 외부 TR provider 비용 pass-through
- 국내/해외 VASP 연동비
- 운영 지원비

3. Custom Integration
- 금융기관 망분리/전용망 연동
- 국내 VASP 직접 연동
- 해외 VASP direct rail 구축
- 기관별 정책 커스터마이징
```

핵심은 TTR 자체에서 큰 이익을 내는 것이 아니라, **TTR을 통해 TranSight KYT 계약을 더 쉽게 성사시키고 고객을 장기 락인시키는 것**이다.

---

## 16. Agent Development Guide

현재 CODEVASP와 유사한 구조로 만들어진 TTR은 특정 프로토콜 중심 구조에서 벗어나, provider-agnostic adapter architecture로 고도화해야 한다.

### 16.1 Core Instruction

```text
TTR must be upgraded from a CODEVASP-like Travel Rule implementation
to a provider-agnostic Digital Asset Compliance Gateway.

GTR Direct should be implemented as the first global external adapter,
but the core business logic must not be coupled to GTR.

The architecture must support domestic direct adapters, global bootstrap adapters,
provider bridge adapters, and direct overseas VASP adapters.
```

### 16.2 Required Adapter Types

```text
1. Domestic Direct Adapters
   - Upbit
   - Bithumb
   - Future domestic VASPs

2. Global Bootstrap Adapter
   - GTR Direct

3. Provider Bridge Adapters
   - Notabene
   - Sumsub
   - Other Travel Rule providers

4. Direct Overseas VASP Adapter
   - Bybit Direct first
   - Binance / Bitget / OKX later

5. Manual / OON Adapter
   - Unsupported VASP
   - Email/link-based fallback
   - Manual compliance review
```

### 16.3 Required Modules

```text
1. Institution API Layer
- API key / mTLS / JWT support
- tenant identification
- request authentication

2. TTR Core
- transaction intake
- Travel Rule threshold check
- PII normalization
- KYT request
- routing decision
- compliance decision
- audit logging

3. Provider Router
- counterparty VASP lookup
- policy-based provider selection
- fallback routing
- timeout / retry handling

4. Adapter Layer
- GTRAdapter
- UpbitAdapter
- BithumbAdapter
- BybitDirectAdapter
- NotabeneAdapter
- SumsubAdapter
- ManualOONAdapter

5. Result Normalizer
- provider response mapping
- match / mismatch / pending / rejected normalization
- approval recommendation
- webhook callback to institution
```

### 16.4 Non-Negotiable Engineering Rules

```text
1. Never couple TTR Core to GTR-specific response format.
2. Store provider-specific raw request/response separately.
3. Normalize every provider result into TTR internal status.
4. Minimize PII plaintext storage.
5. Support encrypted payload routing.
6. Design provider credentials per institution and per adapter.
7. Support institution-specific compliance policy.
8. Log every routing and decision step for audit.
9. KYT risk result must be included before final transaction approval.
10. Fallback routing must be explicit and traceable.
```

---

## 17. Recommended Roadmap

### Phase 1. Bootstrap / PoC

```text
- GTR Direct Adapter 구현
- 기본 PII Verification flow 구현
- Bybit Direct 협의 내용 반영
- TTR 내부 공통 모델 정리
- KYT 연동 decision flow 설계
- 금융기관 PoC용 API 제공
```

목표:

```text
국내 금융기관이 TTR 하나로 해외 주요 VASP와 PII Verification을 테스트할 수 있도록 한다.
```

### Phase 2. Domestic Rail 구축

```text
- Upbit Direct Adapter
- Bithumb Direct Adapter
- 국내 VASP별 계정주 확인 정책 반영
- 국내 특금법 기준 rule engine 고도화
- 국내 스테이블코인 유통 시나리오 적용
```

목표:

```text
TTR을 국내 금융기관 ↔ 국내 핵심 VASP 간 TR Bridge로 만든다.
```

### Phase 3. Hybrid Global Routing

```text
- Bybit Direct Rail 정식화
- GTR fallback 운영
- Notabene / Sumsub provider bridge 검토
- 해외 VASP별 preferred rail 관리
- provider routing policy 고도화
```

목표:

```text
해외 VASP별 기존 TR provider 또는 TTR Direct 중 가장 편한 방식으로 연결한다.
```

### Phase 4. TTR Network

```text
- 금융기관 고객 다수 온보딩
- 해외 VASP TTR Direct 참여 확대
- TTR Network Member 개념 도입
- KYT intelligence sharing / risk signal 고도화
- 정부기관·금융기관 표준 인프라화
```

목표:

```text
TTR을 한국 디지털 자산 유통의 컴플라이언스 브릿지로 만들고, TranSight KYT를 표준 인텔리전스 레이어로 만든다.
```

---

## 18. Final Positioning

TTR v2의 최종 포지션은 다음과 같다.

```text
TTR is not just a Travel Rule solution.
TTR is a Digital Asset Compliance Gateway.
```

한국어로는 다음과 같이 정의한다.

```text
TTR은 단순 트래블룰 솔루션이 아니라,
국내 금융기관이 디지털 자산을 유통하기 위해 필요한
KYT, Travel Rule, PII Verification, VASP 연결성, 감사증적을 통합 제공하는
디지털 자산 컴플라이언스 패키지다.
```

가장 중요한 전략 문장은 다음과 같다.

```text
TTR의 목적은 독립적인 대형 Travel Rule 사업을 만드는 것이 아니라,
TranSight KYT를 국내 금융기관 디지털 자산 유통 인프라의 표준으로 만들기 위한
Compliance Gateway를 제공하는 것이다.

TR은 고객 온보딩을 쉽게 만드는 배관이고,
KYT는 회사의 핵심 IP이자 인텔리전스 자산이다.
```

---

## 19. One-Line Summary

```text
TTR은 GTR Direct를 초기 글로벌 커버리지 확보용 bootstrap rail로 활용하고,
국내 VASP 및 주요 해외 VASP와의 direct rail을 단계적으로 확대하여,
TranSight KYT를 중심으로 한 디지털 자산 유통 컴플라이언스 패키지를 구축한다.
```

---

## 20. 구현 현황 (2026-06-06 기준)

### 20.1 Core Infrastructure

| 모듈 | 상태 | 비고 |
|------|------|------|
| Edge Function (Deno) | ✅ 구현 | Supabase Edge Functions |
| VASP Registry | ✅ 구현 | CRUD + 공개키 로테이션 + 주소 검증 |
| Transfer Auth | ✅ 구현 | 출금/입금/상태조회/결과보고/취소 |
| KYT Atomic Gate | ✅ 구현 | 위험 주소 자동 차단, PII 미전송 |
| Protocol Adapter Router | ✅ 구현 | alliance_name 기반 라우팅 |
| Audit Log | ✅ 구현 | 전체 의사결정 추적 |
| Security Layer | ✅ 구현 | Ed25519 서명, Rate Limit, Nonce, Timestamp |
| TTL Queue (Escrow) | ✅ 구현 | 입금 TR 매칭용 |
| NaCl Box E2E 암호화 | ✅ 구현 | PII 비열람 구조 |

### 20.2 Protocol Adapters

| Adapter | Alliance | 상태 | 설명 |
|---------|----------|------|------|
| CodeVaspAdapter | `code` | ✅ 구현 | 업비트/빗썸/코인원/코빗 등 CODE 회원 |
| SumsubAdapter | `sumsub` | ✅ 구현 | TRUST 프로토콜 (PII 평문 이슈 존재) |
| GtrAdapter | `gtr` | ✅ 구현 | One-Step PII Verification (Binance, OKX 등) |
| DirectAdapter | `direct` | ✅ 구현 | P2P 직접 연결 (Bybit 등) |
| TransightInternalAdapter | `transight` | ✅ 구현 | 동일 얼라이언스 내부 |
| VerifyVaspAdapter | `verifyvasp` | ⚠️ Stub | VV Central Server (향후) |
| UpbitDirectAdapter | - | ❌ 미구현 | Phase 2 |
| BithumbDirectAdapter | - | ❌ 미구현 | Phase 2 |
| BybitDirectAdapter | - | ❌ 미구현 | Phase 2 |
| NotabeneAdapter | - | ❌ 미구현 | Phase 3 |
| ManualOONAdapter | - | ❌ 미구현 | Phase 3 |

### 20.3 GTR Adapter 상세

GTR Adapter는 글로벌 해외 VASP 커버리지 확보를 위한 초기 bootstrap rail로 구현 완료되었다.

```text
구현된 기능:
1. GTR VASP 프로필 DB (gtr_vasp_profiles)
2. GTR 전송 로그 DB (gtr_transfer_logs) — PII 미저장, SHA-256 해시만
3. One-Step PII Verification API 호출
4. GTR 응답 → TTR 결과 매핑 (verified/denied)
5. Curve25519 공개키 관리 및 만료 체크
6. 10초 타임아웃 + fail-closed 정책
7. adapterOptions.gtr 클라이언트 옵션 지원
```

```text
PII 보안 원칙 준수:
- Hub는 payload를 복호화하지 않음
- 금융기관이 GTR Curve25519로 직접 암호화한 payload 그대로 전달
- 로그에는 SHA-256(payload) 해시만 저장
- PII 원문은 Hub 서버 메모리에도 존재하지 않음
```

### 20.4 DB Schema 현황

```text
기존 테이블:
- vasps                    VASP 레지스트리
- public_keys              공개키 관리
- transfers                Travel Rule 전송 기록
- ttl_queue                TTL 에스크로 매칭
- audit_log                감사 로그
- kyt_tr_block_registry    KYT 자동 차단 레지스트리

GTR Adapter 추가 (2026-06-06):
- gtr_vasp_profiles        GTR VASP 프로필 (Curve25519 키, 검증 필드 등)
- gtr_transfer_logs        GTR 전송 로그 (검증 결과, 해시만)
```

### 20.5 미구현 (Phase 2~3 대상)

```text
1. Tenant / Institution 멀티테넌시
2. Travel Rule 임계값 Rule Engine
3. PII Verification Orchestrator (멀티 프로바이더 통합)
4. Webhook / Status Manager
5. 국내 VASP Direct Adapter (업비트, 빗썸)
6. 해외 VASP Direct Adapter (Bybit)
7. Provider Bridge Adapter (Notabene)
8. Manual / OON Adapter
9. STR 후보 탐지 연계
10. 기관별 정책 커스터마이징
```

---

## 21. 국내 VASP 연동 비용 분석

### 21.1 빗썸 (CODEVASP 사용 중)

TTR은 CODE VASP 프로토콜을 완전 호환한다. 빗썸이 TTR을 추가 연결하는 데 필요한 개발 공수:

```text
개발 공수: 약 1일
난이도:    ★☆☆☆☆ (5점 만점 중 1)
```

변경 사항:
```text
1. TTR Hub API URL 추가 (설정 1줄)
2. TTR Hub Ed25519 공개키 등록 (설정 1줄)
3. VASP 라우팅 분기 추가 ("이 VASP는 TTR 경유")
4. 수신 TR webhook 설정 (TTR→빗썸)
```

변경하지 않아도 되는 것:
```text
- 기존 CODEVASP 코드: 그대로 유지
- Ed25519 서명 로직: 동일
- NaCl Box 암호화: 동일
- IVMS101 포맷: 동일
- 기존 CODE 연결: 해지 불필요
```

영업 메시지:
```text
빗썸님, 지금 쓰시는 CODEVASP 코드 그대로 두시면 됩니다.
TTR이 같은 프로토콜로 연결하니까, 설정 하나 추가하시면
국내 금융기관·해외 VASP까지 TR/PII Verification 커버리지가 확장됩니다.
개발 공수는 1일 이내입니다.
```

CODEVASP 동의 관련:
```text
TTR은 CODEVASP Hub를 경유하지 않고 빗썸과 직접 P2P 연결한다.
따라서 CODEVASP의 동의가 기술적으로 불필요하다.
빗썸은 CODE 계약을 유지하면서 TTR도 병행할 수 있다.
```

### 21.2 업비트 (CODEVASP + VerifyVASP 사용 중)

업비트는 이미 CODE + VV 2개 솔루션을 병행 중이므로, 멀티 솔루션 구조에 익숙하다.
TTR은 CODE 호환이므로 빗썸과 동일한 수준의 공수로 연결 가능하다.

```text
개발 공수: 약 1~2일
난이도:    ★☆☆☆☆ ~ ★★☆☆☆
```

### 21.3 금융기관 (신규 연동)

금융기관은 기존 TR 솔루션이 없으므로, TTR이 첫 번째이자 유일한 TR Gateway가 된다.

```text
개발 공수: 1~2주 (망분리/전용선 연동 포함)
난이도:    ★★★☆☆
```

금융기관 연동의 핵심은 개발 난이도가 아니라 보안/인프라 환경:
```text
1. 망분리 대응: 전용선/VPN/mTLS 채널 구성
2. Ed25519 키쌍 생성 및 안전한 키 보관
3. NaCl Box 암호화 라이브러리 도입
4. IVMS101 payload 생성 로직
5. 내부 KYC DB 연동 (송신인 정보 자동 입력)
6. 내부 승인/거절 워크플로우 연동
```

---

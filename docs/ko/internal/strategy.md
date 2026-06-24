# TTR 전략 (v2)

## 디지털 자산 유통을 위한 컴플라이언스 패키지

::: tip 핵심 정의
TTR은 단순 트래블룰 솔루션이 아니라, 국내 금융기관이 디지털 자산을 유통하기 위해 필요한 **KYT + Travel Rule + PII Verification + VASP 연결성 + 감사증적**을 통합 제공하는 **디지털 자산 컴플라이언스 게이트웨이**입니다.
:::

## 전략 공식

```
Digital Asset Compliance Package
= TranSight KYT + TTR Travel Rule Bridge + PII Verification
  + Domestic/Global VASP Connectivity + Audit Evidence
```

## 전략적 위계

| 순위 | 목표 | 설명 |
|------|------|------|
| **1순위** | TranSight KYT를 금융기관 표준으로 | 핵심 IP = 주소 인텔리전스, 자금흐름 분석, 위험평가 모델 |
| **2순위** | TTR로 KYT 도입 장벽을 낮춤 | TR은 고객 온보딩을 쉽게 만드는 배관 |
| **3순위** | TR 자체는 적자 안 내는 인프라 | TR = Compliance Plumbing |

::: warning 핵심 원칙
TTR의 목적은 독립적인 대형 Travel Rule 사업이 아니라, **TranSight KYT를 국내 금융기관 디지털 자산 유통 인프라의 표준으로 만들기 위한 Compliance Gateway를 제공하는 것**입니다.
:::

## TTR의 4가지 역할

### 1. Domestic TR Bridge
국내 금융기관 ↔ 국내 핵심 VASP 직접 연결

- Upbit Direct Adapter
- Bithumb Direct Adapter
- 향후 Coinone, Korbit, Gopax

### 2. Global TR Router
초기 GTR Direct → 향후 Direct Rail 확대

- GTR Direct Adapter (초기 bootstrap)
- Notabene Adapter (향후)
- Manual / OON fallback

### 3. PII Verification Hub
해외 VASP 송금 시 계정주 확인

- 이름 match / 생년월일 match / 법인명 match
- 주소 소유 확인 / 수취 VASP 계정 확인

### 4. Stablecoin Compliance Gateway
TranSight KYT와 결합한 스테이블코인 유통 준법 게이트웨이

- KYT risk score + Travel Rule decision + PII verification
- Approval / hold / reject recommendation
- Audit trail + STR candidate generation

## 해외 VASP 연결 옵션

해외 VASP에게는 세 가지 연결 옵션을 제공합니다:

| 옵션 | 방식 | 설명 |
|------|------|------|
| **A. Provider Bridge** | TTR → 기존 TR 솔루션 → 해외 VASP | 기존 솔루션 변경 불필요 |
| **B. TTR Direct API** | TTR → 해외 VASP 직접 | 경량 PII Verification부터 시작 |
| **C. TTR Network Member** | TTR 네트워크 정식 참여 | 한국 금융기관 네트워크 접근 |

## 아키텍처

```
[국내 금융기관]
 Banks / Pay / Stablecoin / Custodians
                │
                ▼
             [TTR Core]
 ┌──────────────────────────────────┐
 │ - Tenant / Institution Mgmt      │
 │ - Travel Rule Rule Engine         │
 │ - PII Verification Orchestrator   │
 │ - IVMS101 Normalizer              │
 │ - Encryption / Key Policy         │
 │ - KYT Risk Engine Integration     │
 │ - Audit Evidence / Logs           │
 │ - Status & Webhook Manager        │
 └──────────────────────────────────┘
                │
 ┌──────────────┼───────────────────┐
 ▼              ▼                   ▼
Domestic      Global Bootstrap    Direct VASP
Direct Rail   / Provider Bridge   Network
               │                   │
Upbit        GTR                 Bybit Direct
Bithumb      Notabene            Binance Direct
Coinone      Sumsub/TRP          OKX Direct
```

## 비즈니스 모델

| 구성 | 내용 |
|------|------|
| **TranSight KYT 주계약** | API 사용료, Web 계정, 모니터링, 심층분석, STR/보고서 |
| **TTR 부가 모듈** | 월 기본료, 거래량 기반 수수료, 외부 TR 비용 pass-through |
| **Custom Integration** | 금융기관 망분리 연동, 국내/해외 VASP direct rail 구축 |

## 로드맵

| Phase | 목표 | 핵심 작업 |
|-------|------|-----------|
| **Phase 1** | PoC / Bootstrap | GTR Adapter ✅, KYT 연동, 금융기관 PoC |
| **Phase 2** | Domestic Rail | 업비트/빗썸 Direct, 국내 특금법 rule engine |
| **Phase 3** | Hybrid Global | Bybit Direct, GTR fallback, Notabene bridge |
| **Phase 4** | TTR Network | 해외 VASP 직접 참여, KYT intelligence sharing |

→ 상세 전략은 [TTR_Strategy_v2_Digital_Asset_Compliance_Package.md](/TTR_Strategy_v2_Digital_Asset_Compliance_Package) 참조

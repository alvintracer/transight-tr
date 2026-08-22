# VASP 및 금융기관 연동 비용

이 문서는 redesign 이후 연동 난이도를 추정하기 위한 내부 메모입니다.

## Summary

| 대상 | 기본 방식 | 예상 난이도 | 주요 작업 |
|------|-----------|-------------|-----------|
| CodeVASP 경험이 있는 VASP | SDK 또는 API endpoint 추가 | 낮음 | TravelSafer endpoint, public key 등록, routing 추가 |
| 신규 VASP | Cloud API | 중간 | key 생성, payload 암호화, callback 구현 |
| 금융기관 | TravelSafer IDC 채널 | 중간 | 전용성 채널, API mapping, 위수탁/보안검토 |
| 해외 VASP | Cloud API 또는 edge node | 중간 | public key 등록, encrypted relay, OwnerCheck 응답 |
| 비의무 VASP | OwnerCheck 제한 연동 | 낮음-중간 | account owner check endpoint와 policy 합의 |

## CodeVASP-Compatible VASP

기존 CodeVASP 구조를 가진 VASP는 다음 요소를 재사용할 수 있습니다.

| Reusable | Notes |
|----------|-------|
| Ed25519 signing key | request signing과 registry key 관리에 사용 |
| Ed25519 to X25519 derivation | encrypted payload 생성에 사용 |
| IVMS101 payload builder | Travel Rule 본 검증에 사용 |
| beneficiary callback | `transfer-auth/incoming` 또는 partner endpoint로 mapping |

추가 작업은 보통 다음 정도입니다.

1. TravelSafer endpoint 등록
2. VASP public key 등록 및 rotation 절차 합의
3. outbound routing 분기 추가
4. OwnerCheck를 사용할 경우 별도 endpoint 또는 handler 추가

## Financial Institutions

금융기관은 VASP 내부 컨테이너 설치나 해외 SaaS 직접 통신보다 TravelSafer IDC 채널을 기본 제안으로 둡니다.

| Work Item | Notes |
|-----------|-------|
| Network channel | 전용회선, VPN/IPsec, mTLS 중 기관 보안정책에 맞게 선택 |
| Contract boundary | 개인정보 처리 위수탁, 재위탁, 접근통제, 보관기간 명시 |
| Payload mapping | 기존 원화입출금/VAN interface 수준의 request mapping |
| Audit evidence | 요청, routing, result, txHash, operator action metadata |
| Security review | TravelSafer IDC, key management, log masking, 장애 대응 절차 |

금융기관의 개발 부담은 암호화 라이브러리 도입보다 보안심사와 망연계 절차가 더 큰 비중을 차지할 가능성이 높습니다.

## OwnerCheck Cost

OwnerCheck는 새 기능이므로 정책 합의가 필요합니다.

| Topic | Decision Needed |
|-------|-----------------|
| Name normalization | 한글, 영문, 띄어쓰기, 법인명 비교 방식 |
| Date of birth | `YYYYMMDD`, 외국인 식별자, 법인 설립일 처리 |
| Address ownership | 주소, memo/tag, chain별 주소 format |
| Response vocabulary | `matched`, `not_matched`, `insufficient_information`, `manual_review` |
| Privacy mode | encrypted payload v1, salted hash 또는 PSI v2 검토 |

## Sales Message

금융기관에는 "해외 SaaS 직접연동을 대신하는 국내 운영형 Travel Rule Solution"로 설명합니다. VASP에는 "기존 CodeVASP pipeline에 가까운 public key relay와 OwnerCheck extension"으로 설명합니다.

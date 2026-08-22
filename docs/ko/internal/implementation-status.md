# 구현 현황

최종 업데이트: 2026-08-21

## Current Core

TravelSafer은 2026-08 redesign 이후 다음 core로 정리합니다.

| Component | Status | Role |
|-----------|--------|------|
| VASP Registry | Active | VASP metadata, endpoint, active public key 관리 |
| Public Key Directory | Active | 수신 VASP public key 조회와 rotation |
| Transfer Auth | Active | encrypted IVMS101 payload relay와 상태 관리 |
| OwnerCheck | Active | 동일 계정주 검증 relay extension |
| KYT Gate | Active | relay 전 risk check와 block policy |
| Protocol Adapter | Active-limited | Bonanza/CodeVASP-compatible route만 활성 |
| Transfer Response | Legacy | 기존 응답 흐름 호환용 |

## Disabled By Design

다음 adapter는 core data plane에서 제외합니다.

| Adapter | Status | Reason |
|---------|--------|--------|
| GTR | Disabled | 외부 provider rail로 분리 검토. 현재 core scope 아님 |
| Sumsub | Disabled | 외부 SaaS data plane 의존도와 계약 구조 불명확 |
| VerifyVASP | Disabled | Enclave/VV Central 구조와 별도 파트너 모델로 분리 |

비활성 adapter 호출은 `PROTOCOL_DISABLED` 정책 응답을 반환합니다.

## Implemented API Surface

| API | Purpose |
|-----|---------|
| `GET /health` | Service health check |
| `GET /vasp-registry` | VASP 목록 조회 |
| `GET /vasp-registry/pubkey/{vaspEntityId}` | active public key 조회 |
| `POST /vasp-registry` | VASP와 최초 public key 등록 |
| `POST /vasp-registry/rotate-key` | public key rotation |
| `POST /transfer-auth` | 출금 Travel Rule relay |
| `POST /transfer-auth/incoming` | 입금 encrypted Travel Rule 수신 |
| `GET /transfer-auth?id={transferId}` | Transfer 상태 조회 |
| `POST /transfer-auth/result` | txHash 보고 |
| `POST /owner-check` | 동일 계정주 검증 |

## Data Boundary

| Data | TravelSafer core handling |
|------|-----------------------|
| VASP public key | 저장 및 공개 조회 |
| Encrypted IVMS101 payload | relay, metadata 기록 |
| Transfer metadata | 상태, routing, result, audit 저장 |
| OwnerCheck payload | encrypted relay 기준 |
| 이름, 생년월일 | v1 public relay에서는 평문 저장 없음 |
| 금융기관 IDC 채널 평문 | 별도 위수탁, 전용성 채널, 운영 통제로 제한 |

## Remaining Engineering Work

| Area | Next Action |
|------|-------------|
| OwnerCheck policy | 국내 VASP별 name/DOB normalization rule 확정 |
| SDK/assistant | 기존 CodeVASP 사용 기관이 npm install로 붙는 자동화 제공 |
| FI channel | 전용회선, VPN/IPsec, mTLS 운영 profile 문서화 |
| Admin console | VASP key rotation, endpoint, health, SLA 화면 |
| Audit pack | 금융기관 제출용 처리흐름, 로그 항목, 장애 대응 evidence 정리 |

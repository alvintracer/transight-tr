# 구현 현황

> 최종 업데이트: 2026-06-06

## Core Infrastructure

| 모듈 | 상태 | 비고 |
|------|------|------|
| Edge Function (Deno) | ✅ | Supabase Edge Functions |
| VASP Registry | ✅ | CRUD + 공개키 로테이션 + 주소 검증 |
| Transfer Auth | ✅ | 출금/입금/상태조회/결과보고/취소 |
| KYT Atomic Gate | ✅ | 위험 주소 자동 차단, PII 미전송 |
| Protocol Adapter Router | ✅ | alliance_name 기반 라우팅 |
| Audit Log | ✅ | 전체 의사결정 추적 |
| Security Layer | ✅ | Ed25519 서명, Rate Limit, Nonce, Timestamp |
| TTL Queue (Escrow) | ✅ | 입금 TR 매칭용 |
| NaCl Box E2E 암호화 | ✅ | PII 비열람 구조 |

## Protocol Adapters

| Adapter | Alliance | 상태 | 프로토콜 | 대상 |
|---------|----------|------|----------|------|
| `CodeVaspAdapter` | `code` | ✅ 구현 | NaCl Box + Ed25519 | 업비트, 빗썸, 코인원, 코빗 |
| `SumsubAdapter` | `sumsub` | ✅ 구현 | HMAC-SHA256 | Sumsub TRUST 프로토콜 |
| `GtrAdapter` | `gtr` | ✅ 구현 | Curve25519 + X-API-KEY | Binance, OKX, Bybit (GTR 경유) |
| `DirectAdapter` | `direct` | ✅ 구현 | NaCl Box + Ed25519 | P2P 직접 연결 |
| `TransightInternalAdapter` | `transight` | ✅ 구현 | 내부 DB | 동일 얼라이언스 |
| `VerifyVaspAdapter` | `verifyvasp` | ⚠️ Stub | SHA-256 이름 해시 | VV Central Server |

::: info GTR Adapter 상세
- GTR VASP 프로필 DB (`gtr_vasp_profiles`)
- GTR 전송 로그 DB (`gtr_transfer_logs`) — PII 미저장, SHA-256 해시만
- One-Step PII Verification API 호출
- GTR 응답 → TTR 결과 매핑 (verified / denied)
- Curve25519 공개키 관리 및 만료 체크
- 10초 타임아웃 + fail-closed 정책
- `adapterOptions.gtr` 클라이언트 옵션 지원

→ [GTR Adapter API 문서](/ko/api/gtr-adapter)
:::

## DB Schema

### 기존 테이블

| 테이블 | 용도 |
|--------|------|
| `vasps` | VASP 레지스트리 |
| `public_keys` | 공개키 관리 |
| `transfers` | Travel Rule 전송 기록 |
| `ttl_queue` | TTL 에스크로 매칭 |
| `audit_log` | 감사 로그 |
| `kyt_tr_block_registry` | KYT 자동 차단 레지스트리 |

### GTR Adapter 추가 (2026-06-06)

| 테이블 | 용도 |
|--------|------|
| `gtr_vasp_profiles` | GTR VASP 프로필 (Curve25519 키, 검증 필드) |
| `gtr_transfer_logs` | GTR 전송 로그 (검증 결과, 해시만) |

## 미구현 (Phase 2~3)

::: warning 다음 단계
1. Tenant / Institution 멀티테넌시
2. Travel Rule 임계값 Rule Engine
3. PII Verification Orchestrator (멀티 프로바이더)
4. Webhook / Status Manager
5. 국내 VASP Direct Adapter (업비트, 빗썸)
6. 해외 VASP Direct Adapter (Bybit)
7. Provider Bridge Adapter (Notabene)
8. Manual / OON Adapter
9. STR 후보 탐지 연계
10. 기관별 정책 커스터마이징
:::

## Phase 매핑

| Phase | 상태 | 핵심 작업 |
|-------|------|-----------|
| **Phase 1** Bootstrap | 🟢 진행 중 | GTR Adapter ✅, KYT Gate ✅, Core API ✅ |
| **Phase 2** Domestic Rail | ⬜ 예정 | 업비트/빗썸 Direct Adapter |
| **Phase 3** Hybrid Global | ⬜ 예정 | Bybit Direct, Notabene Bridge |
| **Phase 4** TTR Network | ⬜ 예정 | 해외 VASP 직접 참여 |

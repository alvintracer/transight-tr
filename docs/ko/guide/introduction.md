# 소개

## TranSight TR이란?

**TranSight TR**은 가상자산 서비스 제공자(VASP)와 금융기관을 위한 **비대칭 브릿지 기반 트래블룰(Travel Rule) 솔루션**입니다.

기존 TR 솔루션들이 동일한 프로토콜을 사용하는 VASP 간에만 통신이 가능한 반면, TranSight TR은 **비대칭 브릿지 아키텍처**를 통해 서로 다른 보안 요구사항과 프로토콜을 가진 기관들을 하나의 네트워크로 연결합니다.

## 왜 TranSight TR인가?

### 1. 비대칭 브릿지

| 연결 대상 | 채널 | 보안 수준 |
|-----------|------|-----------|
| 가상자산 거래소 | HTTPS + OAuth 2.0 | TLS 1.3 + AES-256 |
| 인터넷전문은행 | mTLS + OAuth 2.0 | 상호 인증서 검증 |
| 보수적 은행 | IPSec VPN | 암호화 터널 |
| 기구축 은행 | 전용선 (Leased Line) | 물리적 격리 |

### 2. Atomic KYT Gate

```
KYT 조회 → BLOCK? → PII 전송 차단 (개인정보 보호)
         → PASS?  → TR 메시지 전달 진행
```

KYT(Know Your Transaction) 결과가 나오기 **전에** 개인정보(PII)가 외부로 전송되지 않습니다.

### 3. 크로스 솔루션 호환

TranSight TR은 다음 얼라이언스와 프로토콜 레벨에서 상호운용됩니다:

- **CODE VASP** — NaCl Box 암호화 + Ed25519 서명
- **VerifyVASP** — OpenVASP 기반
- **해외 VASP** — 직접 연동 (Bybit, Bitget 등)

## 핵심 기술 스택

| 구성 요소 | 기술 |
|-----------|------|
| 암호화 | NaCl Box (X25519 + XSalsa20-Poly1305) |
| 서명 | Ed25519 |
| 메시지 포맷 | IVMS101 (FATF 표준) |
| 상태 관리 | 8단계 상태 머신 |
| 백엔드 | Supabase (PostgreSQL + Edge Functions) |
| 런타임 | TypeScript (Deno / Node.js) |

## 다음 단계

- [아키텍처](./architecture.md) — 시스템 구조 이해
- [빠른 시작](./quickstart.md) — 5분 안에 첫 TR 전송
- [API 문서](/ko/api/overview) — API 엔드포인트 레퍼런스

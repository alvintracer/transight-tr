# 소개

## TranSight TR이란?

**TranSight TR**은 가상자산 서비스 제공자(VASP)와 금융기관을 위한 **비대칭 브릿지 기반 트래블룰(Travel Rule) 솔루션**입니다.

기존 TR 솔루션들이 동일한 프로토콜을 사용하는 VASP 간에만 통신이 가능한 반면, TranSight TR은 **비대칭 브릿지 아키텍처**를 통해 서로 다른 보안 요구사항과 프로토콜을 가진 기관들을 하나의 네트워크로 연결합니다.

## 왜 TranSight TR인가?

### 1. 비대칭 브릿지

금융기관마다 선호하거나 요구하는 보안 컴플라이언스 기준이 각기 다릅니다. TranSight TR은 하나의 고정된 프로토콜을 강요하지 않고, 각 금융기관이 선호하는 보안 채널 방식에 맞추어 맞춤형 연결을 제공합니다.

| 대상 기관 | 지원 보안 채널 옵션 | 보안 수준 및 특징 |
|-----------|--------------------|-------------------|
| 가상자산 거래소 | HTTPS + OAuth 2.0 | TLS 1.3 + 표준화된 AES-256 암호화 통신 |
| 금융기관 | mTLS / IPSec VPN / 전용선 (Leased Line) | 상호 인증서 검증, 전용 암호화 터널, 물리적 격리 지원 |

* **맞춤형 보안 채널 지원**: 금융기관의 자체 규정에 따라 `mTLS + OAuth 2.0`, `IPSec VPN` 또는 `전용선 (Leased Line)` 중 최적의 옵션을 선택적으로 구축 및 연동할 수 있습니다.
* **전용선 연동**: 기존에 전용망/전용선을 구축한 금융기관의 경우, 기존 설비를 그대로 활용한 전용선 연결 역시 완벽하게 지원합니다.

### 2. Atomic KYT Gate

```
KYT 조회 → BLOCK? → PII 전송 차단 (개인정보 보호)
         → PASS?  → TR 메시지 전달 진행
```

KYT(Know Your Transaction) 결과가 나오기 **전에** 개인정보(PII)가 외부로 전송되지 않습니다.

### 3. 크로스 솔루션 호환

TranSight TR은 다음 얼라이언스 및 글로벌 컴플라이언스 솔루션과 프로토콜 레벨에서 완전한 상호운용성을 보장합니다:

- **CODE VASP** — NaCl Box 암호화 + Ed25519 서명 기반 국내 거래소 호환
- **Sumsub Hub** — HMAC-SHA256 서명 기반 글로벌 컴플라이언스 및 TRUST(Travel Rule Universal Solution Technology) 얼라이언스 호환
- **VerifyVASP** — OpenVASP 프로토콜 호환 기반 연결 지원
- **해외 VASP** — 직접 연동 및 커스텀 프로토콜 중개 (Bybit, Bitget 등)

## 핵심 기술 스택

| 구성 요소 | 기술 |
|-----------|------|
| 암호화 | NaCl Box (X25519 + XSalsa20-Poly1305) |
| 서명 | Ed25519 |
| 메시지 포맷 | IVMS101 (FATF 표준) |
| 상태 관리 | 8단계 상태 머신 |
| 백엔드 | Cloud Native Serverless (PostgreSQL + API Hub) |
| 런타임 | TypeScript (Deno / Node.js) |

## 다음 단계

- [아키텍처](./architecture.md) — 시스템 구조 이해
- [빠른 시작](./quickstart.md) — 5분 안에 첫 TR 전송
- [API 문서](/ko/api/overview) — API 엔드포인트 레퍼런스

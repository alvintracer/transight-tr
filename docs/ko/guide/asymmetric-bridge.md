# 비대칭 브릿지

## 개요

TranSight Hub의 비대칭 브릿지는 **Protocol Adapter 패턴**을 사용하여 서로 다른 TR 솔루션과 통신 채널을 통합합니다.

수신 VASP의 `alliance_name`에 따라 자동으로 적절한 프로토콜 어댑터가 선택됩니다.

## 아키텍처

```
             Transfer Auth 요청
                    │
                    ▼
         ┌──────────────────┐
         │  Protocol Router │ ← alliance_name으로 라우팅
         └──┬──────┬──────┬─┘
            │      │      │
    ┌───────▼──┐ ┌─▼────┐ ┌▼──────────┐
    │  CODE    │ │ TSI  │ │  Direct   │
    │ Adapter  │ │ (내부)│ │ Adapter   │
    └────┬─────┘ └──┬───┘ └─────┬─────┘
         │          │           │
    CODE API    Supabase   HTTPS/mTLS
    (외부)       (DB 직접)   (개별 연결)
```

## 프로토콜 어댑터

### CODE VASP Adapter (`code`)

| 항목 | 내용 |
|------|------|
| 대상 | CODE Alliance 소속 VASP |
| 엔드포인트 | `https://trapi.codevasp.com/v1/code/transfer/{vaspId}` |
| 인증 | Ed25519 서명 헤더 (5종) |
| 암호화 | NaCl Box (XSalsa20-Poly1305) |
| 특징 | 완전한 CODE 프로토콜 호환 |

**요청 흐름**:
1. Hub → CODE API: `POST /v1/code/transfer/{beneficiaryVaspId}`
2. CODE 헤더 서명 생성 (datetime + body + nonce)
3. 수신 VASP 공개키로 payload 암호화
4. CODE API 응답 → verified/denied 반환

### TranSight Internal Adapter (`transight`)

| 항목 | 내용 |
|------|------|
| 대상 | TranSight 네트워크 내부 VASP |
| 방식 | Supabase DB 직접 조회 |
| 지연시간 | ~0ms |
| 특징 | 외부 API 호출 없이 즉시 처리 |

**요청 흐름**:
1. Hub: DB에서 수신 VASP 확인
2. 내부 VASP이므로 신뢰 → 즉시 `verified`
3. Transfer 레코드에 직접 기록

### VerifyVASP Adapter (`verifyvasp`)

::: warning 🚧 구현 예정
VerifyVASP는 gRPC 기반 프로토콜을 사용합니다. 별도 gRPC 클라이언트가 필요합니다.
:::

### Direct Adapter (`direct`)

| 항목 | 내용 |
|------|------|
| 대상 | 개별 연결 VASP (해외, 비표준) |
| 프로토콜 | CODE 호환 포맷 over HTTPS |
| 엔드포인트 | 각 VASP의 `endpoint_url` |
| 보안 | HTTPS / mTLS / VPN / 전용선 |

**채널 유형별 보안**:

| 채널 | 대상 | 보안 수준 |
|------|------|-----------|
| `HTTPS` | 거래소 | TLS 1.3 + AES-256 |
| `mTLS` | 인터넷전문은행 | 상호 인증서 검증 |
| `VPN` | 보수적 은행 | IPSec 터널 |
| `LEASED_LINE` | 기구축 은행 | 물리적 격리 |

## API 응답 예시

Transfer Auth 응답에 `adapter` 필드가 포함됩니다:

```json
{
  "result": "verified",
  "transferId": "abc-123",
  "kyt": { "decision": "PASS", "riskScore": 0 },
  "adapter": {
    "protocol": "code",
    "latencyMs": 150
  }
}
```

## 어댑터 선택 로직

```typescript
// alliance_name → adapter 매핑
const adapters = {
  'code':       CodeVaspAdapter,      // CODE API 호출
  'verifyvasp': VerifyVaspAdapter,    // gRPC (예정)
  'transight':  TransightInternal,    // DB 직접
  'direct':     DirectAdapter,        // HTTPS 개별
};

// 미등록 alliance → Direct Adapter fallback
```

## 구현 파일

- [protocol-adapter.ts](/ko/api/overview) — 어댑터 모듈
  - `routeTransfer()` — TR 인가 라우팅
  - `routeTransferResult()` — TXID 전달
  - `routeTransferFinish()` — 취소 전달

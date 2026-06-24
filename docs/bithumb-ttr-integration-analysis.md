# 빗썸 TTR 연동 — 개발 공수 및 난이도 분석

**대상**: 이미 CODEVASP를 사용 중인 빗썸  
**시나리오**: TTR을 추가 Travel Rule 플러그로 연결  
**작성 목적**: 빗썸 기술팀에게 "이거 플러그 하나 더 꽂는 거예요"라고 설명할 때 쓸 근거 자료  

---

## 1. 결론부터

```
빗썸 개발 공수: 거의 0에 가까움
```

TTR은 의도적으로 CODE VASP API 프로토콜을 그대로 사용한다. 빗썸이 이미 CODEVASP에 연동된 상태라면, TTR 연결은 **CODEVASP Hub에 새 VASP 하나가 등록되는 것**과 기술적으로 동일하다.

---

## 2. 빗썸의 현재 CODEVASP 연동 구조

빗썸은 현재 다음 구조로 Travel Rule을 처리하고 있다.

```
빗썸 내부 시스템
  │
  │  HTTPS (CODE 프로토콜)
  │  Ed25519 헤더 서명
  │  NaCl Box 암호화 IVMS101 payload
  │
  ▼
CODEVASP Hub (trapi.codevasp.com)
  │
  ├── 업비트 (CODE 회원)
  ├── 코인원 (CODE 회원)
  ├── 코빗 (CODE 회원)
  └── 기타 CODE 얼라이언스 VASP들
```

빗썸이 이미 구현한 것:

| 구현 항목 | 상세 |
|-----------|------|
| Ed25519 키쌍 생성/관리 | 서명 및 암호화용 |
| CODE 헤더 서명 생성 | `X-Code-Req-Datetime`, `Nonce`, `PubKey`, `Signature`, `X-Request-Origin` |
| NaCl Box 암호화/복호화 | Ed25519→Curve25519 변환 + XSalsa20-Poly1305 |
| IVMS101 payload 생성 | 송수신인 정보 구조체 |
| Transfer Auth API 호출 | `POST /v1/code/transfer/{vaspEntityId}` |
| Transfer Result 보고 | `POST /v1/code/transfer/result/{vaspEntityId}` |
| Transfer Finish (취소) | `POST /v1/code/transfer/finish/{transferId}` |
| VASP Discovery | `GET /v1/code/vasps` |
| Address Verify | `POST /v1/code/address/verify/{vaspEntityId}` |
| 수신 TR 처리 (Receiver) | 타 VASP→CODE→빗썸 수신 |

---

## 3. TTR이 CODE 프로토콜을 쓰는 이유

TTR의 transfer-auth API는 의도적으로 CODE VASP의 API 포맷을 그대로 재현한다.

### 3.1 요청 포맷 비교

| 항목 | CODEVASP | TTR | 차이 |
|------|----------|-----|------|
| **엔드포인트** | `POST /v1/code/transfer/{vaspEntityId}` | `POST /transfer-auth` | URL만 다름 |
| **인증 헤더** | Ed25519 서명 6종 | 동일 6종 | **완전 동일** |
| **transferId** | UUID v4 | UUID v4 | **동일** |
| **currency** | BTC, ETH... | BTC, ETH... | **동일** |
| **amount** | string | string | **동일** |
| **tradePrice** | string | string | **동일** |
| **tradeCurrency** | KRW | KRW | **동일** |
| **isExceedingThreshold** | boolean | boolean | **동일** |
| **payload** | NaCl Box Base64 | NaCl Box Base64 | **동일** |
| **address** | 지갑 주소 | 지갑 주소 | **동일** |
| **tag** | Memo/Tag | Memo/Tag | **동일** |
| **network** | 네트워크명 | 네트워크명 | **동일** |

### 3.2 응답 포맷 비교

| 항목 | CODEVASP | TTR | 차이 |
|------|----------|-----|------|
| **result** | `verified` \| `denied` | `verified` \| `denied` | **동일** |
| **reasonType** | CODE 거부 사유 | CODE 거부 사유 | **동일** |
| **reasonMsg** | 사유 메시지 | 사유 메시지 | **동일** |
| **payload** | 응답 암호문 | 응답 암호문 | **동일** |
| **transferId** | transfer ID | transfer ID | **동일** |
| **kyt** | ❌ 없음 | ✅ KYT 결과 포함 | TTR 확장 (무시 가능) |
| **adapter** | ❌ 없음 | ✅ 프로토콜 메타 | TTR 확장 (무시 가능) |

### 3.3 암호화 방식 비교

| 항목 | CODEVASP | TTR | 차이 |
|------|----------|-----|------|
| 서명 알고리즘 | Ed25519 | Ed25519 | **동일** |
| 암호화 | NaCl Box (XSalsa20-Poly1305) | NaCl Box (XSalsa20-Poly1305) | **동일** |
| 키 교환 | Ed25519→Curve25519 | Ed25519→Curve25519 | **동일** |
| 키 길이 | 32B pub / 64B sec | 32B pub / 64B sec | **동일** |

---

## 4. 빗썸이 TTR을 연결하려면

### 4.1 시나리오 A: CODE 호환 모드 (공수 최소)

빗썸이 이미 CODEVASP용으로 구현한 코드를 **그대로 재사용**하고, 엔드포인트 URL과 공개키만 바꾸면 된다.

```
변경사항:
1. TTR Hub의 API URL 추가 (config 1줄)
2. TTR Hub의 Ed25519 공개키 등록 (config 1줄)
3. TTR Hub를 새 VASP로 인식하도록 라우팅 테이블 추가
```

빗썸 코드에서 바뀌는 것:

```javascript
// AS-IS: CODEVASP만 사용
const CODE_HUB_URL = 'https://trapi.codevasp.com';

// TO-BE: TTR 추가
const TR_HUBS = {
  code: 'https://trapi.codevasp.com',
  ttr:  'https://{TTR_ENDPOINT}/functions/v1',  // ← 이거 1줄 추가
};
```

```javascript
// AS-IS: 모든 요청을 CODE Hub로
function sendTransferAuth(vaspEntityId, payload) {
  return fetch(`${CODE_HUB_URL}/v1/code/transfer/${vaspEntityId}`, ...);
}

// TO-BE: TTR 대상이면 TTR Hub로
function sendTransferAuth(vaspEntityId, payload) {
  const hub = isGtrVasp(vaspEntityId) ? TR_HUBS.ttr : TR_HUBS.code;
  const endpoint = isGtrVasp(vaspEntityId)
    ? `${hub}/transfer-auth`
    : `${hub}/v1/code/transfer/${vaspEntityId}`;
  return fetch(endpoint, ...);
  // 헤더, 바디, 서명 방식은 전부 동일
}
```

### 4.2 개발 공수 산정

| 작업 | 공수 | 설명 |
|------|------|------|
| TTR Hub URL 설정 추가 | **5분** | 환경변수/설정 파일에 1줄 |
| TTR Hub 공개키 등록 | **5분** | 키 관리 시스템에 1건 |
| VASP 라우팅 분기 추가 | **2시간** | "이 VASP는 TTR 경유" 분기 로직 |
| 테스트 | **반나절** | 기존 CODE 테스트 케이스 재활용 가능 |
| 수신 TR 처리 (Receiver) | **2시간** | TTR→빗썸 webhook/callback 설정 |
| 운영 문서 업데이트 | **1시간** | 내부 운영 매뉴얼 |
| **합계** | **약 1일** | |

### 4.3 난이도 분류

```
┌────────────────────────────────────────────┐
│  신규 개발 필요: ❌ 없음                    │
│  기존 코드 수정: 라우팅 분기 1건            │
│  암호화 변경:    ❌ 없음 (동일 NaCl Box)    │
│  프로토콜 학습:  ❌ 불필요 (CODE 동일)      │
│  IVMS101 변경:   ❌ 없음 (동일 포맷)        │
│  테스트 공수:    기존 테스트 재활용          │
│                                             │
│  총 난이도:  ★☆☆☆☆ (5점 만점 중 1)        │
└────────────────────────────────────────────┘
```

---

## 5. 빗썸 입장에서의 가치

"공수가 거의 없다"는 것 자체가 영업 포인트이지만, **왜 플러그를 하나 더 꽂아야 하는지**에 대한 답도 필요하다.

### 5.1 빗썸이 TTR을 쓰면 얻는 것

| 가치 | 설명 |
|------|------|
| **KYT Atomic Gate** | CODE에는 없는 기능. 위험 주소로의 송금 시 PII를 수신 VASP에 전달하기 전에 자동 차단 |
| **금융기관 접점** | 하나은행 등 국내 금융기관이 TTR을 통해 빗썸에 TR을 보낼 수 있음. CODE만으로는 금융기관이 직접 연결하기 어려움 (망분리 문제) |
| **GTR 경유 해외 VASP** | Binance, Bybit 등 GTR 네트워크 VASP와의 PII Verification이 TTR 경유로 가능 |
| **스테이블코인 유통 대비** | 국내 스테이블코인 시장이 열릴 때, 금융기관↔빗썸 간 규제 대응 인프라가 이미 갖춰짐 |
| **감사증적 통합** | KYT 판정 + TR 결과 + PII 검증 결과가 하나의 감사 로그로 통합 제공됨 |

### 5.2 빗썸이 하지 않아도 되는 것

| 항목 | 설명 |
|------|------|
| CODE 해지 | ❌ CODE는 그대로 유지. TTR은 추가 연결 |
| 기존 코드 리팩터링 | ❌ 불필요. 동일 프로토콜이므로 분기만 추가 |
| 새 암호화 라이브러리 도입 | ❌ 불필요. NaCl Box 그대로 |
| IVMS101 스키마 변경 | ❌ 불필요. 동일 포맷 |
| 별도 SDK 설치 | ❌ 불필요. REST API 동일 |

---

## 6. 시나리오 B: TTR Direct Adapter (향후)

Phase 2에서 빗썸이 TTR Network의 Domestic Direct Rail로 참여하는 경우, 빗썸이 추가로 구현해야 하는 것:

| 작업 | 공수 | 설명 |
|------|------|------|
| TTR-Bithumb Direct 전용 API 수신 엔드포인트 | 2~3일 | 빗썸 측에서 TR 수신용 webhook 구성 |
| 계정주 확인 내부 연동 | 1~2주 | 빗썸 내부 KYC DB와 이름/DOB 매칭 |
| 주소 소유 확인 API | 1주 | 지갑 주소 → 빗썸 고객 여부 확인 |

이것은 Phase 1(플러그 연결)과는 별개이며, 빗썸이 **TTR을 통해 금융기관의 TR 요청을 수신하는 역할**을 할 때 필요하다.

---

## 7. 아키텍처 비교

### AS-IS (CODE만)

```
하나은행 ──── ??? (연결 불가, 망분리)
                                           ┌── 업비트
빗썸 ───── CODEVASP Hub ───────────────────┤── 코인원
                                           └── 코빗
Binance ── GTR/Notabene (빗썸과 미연결)
```

### TO-BE (CODE + TTR)

```
하나은행 ──── 전용선/VPN ──── TTR Hub ────── 빗썸 (CODE 호환)
                                │
                                ├──── GTR ──── Binance, Bybit, OKX
                                │
빗썸 ───── CODEVASP Hub ──────── 업비트, 코인원, 코빗 (기존 유지)
```

**핵심 변화**: 빗썸은 코드 한 줄 바꾸지 않아도, TTR이 CODE 프로토콜로 빗썸에 요청을 보내면 빗썸 입장에서는 "CODE Hub에서 온 요청"과 동일하게 처리된다.

---

## 8. 영업용 요약 (한 줄)

```
빗썸님, 지금 쓰시는 CODEVASP 코드 그대로 두시면 됩니다.
TTR이 같은 프로토콜로 연결하니까, 설정 하나 추가하시면
국내 금융기관·해외 VASP까지 TR/PII Verification 커버리지가 확장됩니다.
개발 공수는 1일 이내입니다.
```

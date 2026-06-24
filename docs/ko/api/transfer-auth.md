# Transfer Authorization

TranSight TR의 핵심 API. 출금 TR 인가 요청, 입금 수신, 상태 조회, 결과 보고, 취소를 처리합니다.

## 출금 TR 인가 요청

송신(Originator) VASP가 출금 TR을 요청합니다. **Atomic KYT Gate**가 자동 적용되어, KYT 위험 판정 시 PII가 외부로 전송되지 않습니다.

```http
POST /transfer-auth
Authorization: Bearer <TRANSIGHT_API_KEY>
```

### 요청 본문

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "currency": "BTC",
  "amount": "0.5",
  "tradePrice": "50000000",
  "tradeCurrency": "KRW",
  "isExceedingThreshold": true,
  "payload": "Base64EncodedEncryptedIVMS101",
  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "network": "bitcoin",
  "beneficiaryVaspEntityId": "bithumb-vasp",
  "originatorVaspEntityId": "my-vasp"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `transferId` | `string` | ✅ | UUID v4. 송신 VASP가 생성하는 고유 ID |
| `currency` | `string` | ✅ | 가상자산 심볼 (BTC, ETH 등) |
| `amount` | `string` | ✅ | 전송 수량 |
| `tradePrice` | `string` | ⬜ | 거래 금액 (법정화폐 기준) |
| `tradeCurrency` | `string` | ⬜ | 법정화폐 (기본: KRW) |
| `isExceedingThreshold` | `boolean` | ⬜ | 기준금액 초과 여부 (기본: false) |
| `payload` | `string` | ✅ | IVMS101 PII (수신 VASP 공개키로 NaCl Box 또는 Curve25519 암호화, Base64) |
| `address` | `string` | ⬜ | 수신 지갑 주소 |
| `network` | `string` | ⬜ | 블록체인 네트워크 |
| `beneficiaryVaspEntityId` | `string` | ⬜ | 수신 VASP Entity ID |
| `originatorVaspEntityId` | `string` | ⬜ | 송신 VASP Entity ID |
| `adapterOptions` | `object` | ⬜ | 어댑터별 추가 옵션 ([GTR Adapter](/ko/api/gtr-adapter) 참조) |

### 처리 흐름

```
1. 필수 필드 검증
2. 중복 transferId 검사 → 409 Conflict
3. 송신/수신 VASP 조회
4. 송신 VASP의 KYT 설정 조회 (kyt_mode, kyt_auto_block)
5. ⚡ Atomic KYT Gate (kyt_mode에 따라)
   ├── 'none'  → KYT 스킵, TR만 진행
   ├── 'atomic' + auto_block OFF → KYT 결과 리턴, TR 진행
   └── 'atomic' + auto_block ON  → Block Registry 매칭
       ├── ra_code2 매칭 → 즉시 denied (PII 미전송)
       └── 미매칭       → 계속 진행
6. Transfer 레코드 생성
7. Protocol Adapter → 수신 VASP에 전달
8. 감사 로그 기록
9. 응답 반환
```

### 성공 응답 (KYT PASS)

```json
{
  "result": "verified",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "beneficiaryVasp": {
    "vaspEntityId": "bithumb-vasp",
    "vaspName": "Bithumb"
  },
  "payload": "Base64EncodedEncryptedResponse",
  "kyt": {
    "decision": "pass",
    "riskScore": 12
  },
  "adapter": {
    "protocol": "code",
    "latencyMs": 234
  }
}
```

### GTR Adapter 성공 응답

::: info GTR
`alliance_name=gtr`인 VASP로 요청 시 GTR One-Step PII Verification이 수행됩니다. → [상세](/ko/api/gtr-adapter)
:::

```json
{
  "result": "verified",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "beneficiaryVasp": {
    "vaspEntityId": "binance",
    "vaspName": "Binance"
  },
  "kyt": {
    "decision": "pass",
    "riskScore": 12
  },
  "adapter": {
    "protocol": "gtr",
    "latencyMs": 812
  }
}
```

### GTR 이름 불일치 응답

```json
{
  "result": "denied",
  "reasonType": "INPUT_NAME_MISMATCHED",
  "reasonMsg": "GTR PII verification mismatch: 110026",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "adapter": {
    "protocol": "gtr",
    "latencyMs": 650
  }
}

### KYT 차단 응답

::: danger KYT BLOCK
KYT 위험 판정 시 PII는 외부로 전송되지 않습니다. 이것이 Atomic KYT Gate의 핵심입니다.
:::

```json
{
  "result": "denied",
  "reasonType": "KYT_BLOCK",
  "reasonMsg": "Blocked by ra_code2 registry: DIS (Lazarus), Direct, hop 0",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "kyt": {
    "decision": "block",
    "riskScore": 100,
    "raCode1": "BL",
    "raCode2": "DIS",
    "raCode3": "Lazarus",
    "riskAnalysisType": "Direct",
    "hopCount": 0,
    "provider": "transight"
  }
}
```

::: tip auto_block OFF 모드
`kyt_auto_block=false`인 경우, 위 KYT 결과는 응답에 포함되지만 `result`는 `"verified"`입니다. TR은 정상 진행되며, 고객이 KYT 결과를 보고 수동으로 `/transfer-auth/finish`를 호출하여 취소할 수 있습니다.
:::

---

## 입금 TR 수신

외부 솔루션(CODE, Sumsub 등)으로부터 입금 TR 메시지를 수신합니다.

```http
POST /transfer-auth/incoming
Authorization: Bearer <TRANSIGHT_API_KEY>
```

### 요청 본문

```json
{
  "transferId": "external-transfer-uuid",
  "currency": "ETH",
  "amount": "1.0",
  "tradePrice": "3500000",
  "tradeCurrency": "KRW",
  "payload": "Base64EncodedEncryptedIVMS101",
  "originatorVaspEntityId": "external-vasp",
  "beneficiaryVaspEntityId": "my-vasp"
}
```

### 응답

```json
{
  "result": "verified",
  "transferId": "external-transfer-uuid",
  "message": "Incoming transfer recorded and queued for matching"
}
```

::: tip TTL Queue
입금 TR은 자동으로 TTL Queue에 추가되어 블록체인 입금과 비동기 매칭됩니다 (기본 TTL: 1시간).
:::

---

## Transfer 상태 조회

```http
GET /transfer-auth?id={transferId}
Authorization: Bearer <TRANSIGHT_API_KEY>
```

### 응답

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "verified",
  "direction": "outgoing",
  "currency": "BTC",
  "amount": "0.5",
  "tradePrice": "50000000",
  "tradeCurrency": "KRW",
  "result": "verified",
  "reasonType": null,
  "reasonMsg": null,
  "txid": null,
  "createdAt": "2026-06-02T01:00:00.000Z",
  "updatedAt": "2026-06-02T01:00:05.000Z"
}
```

---

## 전송 결과 보고 (TXID)

블록체인 전송 완료 후 TXID를 보고합니다.

```http
POST /transfer-auth/result
Authorization: Bearer <TRANSIGHT_API_KEY>
```

### 요청 본문

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "txid": "0xabc123def456...",
  "vout": "0"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `transferId` | `string` | ✅ | Transfer ID |
| `txid` | `string` | ✅ | 블록체인 트랜잭션 해시 |
| `vout` | `string` | ⬜ | UTXO 아웃풋 인덱스 (BTC 등) |

### 응답

```json
{
  "result": "success",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "txid": "0xabc123def456...",
  "status": "confirmed"
}
```

::: warning 상태 제한
`verified`, `pending`, `processing` 상태에서만 결과 보고가 가능합니다. 이미 `denied`나 `canceled`된 Transfer는 400 에러를 반환합니다.
:::

---

## 전송 취소

```http
POST /transfer-auth/finish
Authorization: Bearer <TRANSIGHT_API_KEY>
```

### 요청 본문

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "reasonType": "USER_CANCEL",
  "reasonMsg": "User requested cancellation"
}
```

### 응답

```json
{
  "result": "success",
  "transferId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "canceled"
}
```

::: warning 터미널 상태
이미 `denied` 또는 `canceled` 상태인 Transfer는 취소할 수 없습니다.
:::

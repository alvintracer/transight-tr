# Atomic KYT Gate

TranSight TR의 핵심 차별점. KYT(Know Your Transaction) 결과가 나오기 **전에** 개인정보(PII)가 외부로 전송되지 않습니다.

## 개요

TranSight은 KYT와 TR을 **선택적으로 통합**할 수 있습니다:

| 모드 | 설명 | KYT 결과 | TR 진행 |
|------|------|----------|---------|
| **`none`** | TR만 사용 | ❌ KYT 미수행 | ✅ 항상 진행 |
| **`kyt_only`** | KYT만 사용 | ✅ 결과 리턴 | ❌ TR 미사용 |
| **`atomic`** | KYT + TR 통합 | ✅ 결과 리턴 | 설정에 따라 차단/진행 |

## KYT 모드별 동작

### `atomic` 모드 + 자동 차단 ON

```
출금 요청 → KYT API 호출 → ra_code2 확인
                          → Block Registry 매칭?
                            ├── YES → ⛔ PII 미전송, Transfer denied
                            └── NO  → ✅ TR 메시지 전달 진행
```

### `atomic` 모드 + 자동 차단 OFF

```
출금 요청 → KYT API 호출 → KYT 결과 리턴 (ra_code2, riskScore 포함)
                          → TR은 그냥 진행 (고객이 결과 보고 수동 판단)
```

### `none` 모드

```
출금 요청 → KYT 스킵 → TR만 진행
```

## VASP 설정 옵션

| 설정 | 값 | 설명 |
|------|-----|------|
| `kyt_mode` | `none` / `kyt_only` / `atomic` | KYT 운영 모드 |
| `kyt_scope` | `tr_only` / `all` | TR 대상만 KYT 적용 vs 전체 트랜잭션 |
| `kyt_auto_block` | `true` / `false` | 등록된 ra_code2 매칭 시 자동 차단 |
| `kyt_return_for_sar` | `true` / `false` | 차단/경고 시 소명 요청용 상세 RA 정보 리턴 |

::: warning 관리자 전용
KYT 설정은 TranSight 관리자만 변경할 수 있습니다. 고객 API로는 설정 변경이 불가합니다.
:::

## ra_code2 Block Registry

### 개념

고객(VASP)별로 **자동 차단 대상 `ra_code2`**를 등록합니다. KYT 응답의 `ra_code2`가 등록된 코드와 매칭되면 자동으로 TR이 차단됩니다.

::: tip deny_list 대상만
Block Registry는 **deny_list**에 해당하는 `ra_code2`만 대상입니다. white_list RA 코드는 등록 대상이 아닙니다.
:::

### deny_list ra_code2 전체 목록 (TranSight KYT RA v1.3.3)

| ra_code2 | 설명 | risk_level (Direct) | risk_score |
|----------|------|---------------------|------------|
| `OIS` | OFAC/국제제재 대상 | **SEVERE** | 100 |
| `SRA` | 제재관련활동 | **SEVERE** | 100 |
| `DIS` | 북한관련제재대상 | **SEVERE** | 100 |
| `DT` | 다크넷/테러자금 | **SEVERE** | 100 |
| `CSA` | 아동성착취물 | **HIGH** | 98.99 |
| `HA` | 해킹 | **HIGH** | 66.79 |
| `RW` | 랜섬웨어 | **HIGH** | 66.79 |
| `CS` | 사기 (Crypto Scam) | **HIGH** | 66.14 |
| `PS` | 피싱/스캠 | **HIGH** | 66.14 |
| `CSAC` | 아동착취관련활동 | **HIGH** | 60.1 |
| `OG` | 범죄조직 | MEDIUM | 47.42 |
| `VP` | 가상자산 불법사업자 | MEDIUM | 45.3 |
| `IAF` | 불법자금흐름 | MEDIUM | 45.3 |
| `IPT` | 불법거래 (P2P) | MEDIUM | 43.89 |
| `SRC` | 제재위험국가 | MEDIUM | 43.19 |
| `CM` | 코인믹서 | MEDIUM | 42 |
| `PCR` | 개인정보범죄 | MEDIUM | 40 |
| `OKUV` | 해외미확인거래소 | MEDIUM | 40 |
| `KUV` | 국내미확인거래소 | MEDIUM | 40 |
| `OT` | 기타위험 | LOW | 30.5 |
| `UR` | 미확인위험 | LOW | 30.5 |

### RA 모델 구조

```
ra_code3 (주체명)        예: Lazarus, Upbit
    ↓ 딕셔너리 자동 매핑
ra_code2 (위험/특성 유형) 예: DIS (북한관련제재대상), DCE (국내중앙화거래소)
    ↓ 분류 체계표 자동 매핑
ra_code1 (상위 분류)      예: BL (블랙리스트), CE (중앙화 거래소)
```

### 추적 분석 (hop_count)

KYT 결과에는 `risk_analysis_type`과 `hop_count`가 포함됩니다:

| risk_analysis_type | hop_count | 의미 |
|--------------------|-----------|------|
| `Direct` | 0 | 해당 주소가 직접 위험 |
| `Tracked` | 1 | 1홉 추적 (위험 주소와 직접 거래) |
| `Tracked` | 2 | 2홉 추적 |
| `Tracked` | 3 | 3홉 추적 |

Block Registry에서 `risk_analysis_type`과 `max_hop_count`를 설정하면, **Direct만 차단**, **1홉 이내만 차단** 등 세밀한 제어가 가능합니다.

### 매칭 예시

```
Block Registry에 등록: ra_code2='DIS', max_hop_count=1

KYT 결과: ra_code2='DIS', risk_analysis_type='Tracked', hop_count=1
→ ⛔ BLOCK (1홉 이내이므로 매칭)

KYT 결과: ra_code2='DIS', risk_analysis_type='Tracked', hop_count=3
→ ✅ PASS (3홉은 max_hop_count=1 초과이므로 미매칭)
```

## KYT 응답 구조

```json
{
  "decision": "BLOCK",
  "riskScore": 100,
  "riskCategory": "SANCTIONS",
  "riskLabels": ["OFAC"],
  "raCode1": "BL",
  "raCode2": "DIS",
  "raCode3": "Lazarus",
  "riskAnalysisType": "Direct",
  "hopCount": 0,
  "blockReason": "Blocked by ra_code2 registry: DIS (Lazarus), Direct, hop 0",
  "checkedAt": "2026-06-02T01:00:00.000Z",
  "provider": "transight-kyt"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `decision` | `PASS` / `BLOCK` / `WARN` | 최종 판정 |
| `riskScore` | `number` | 0~100 위험도 점수 |
| `raCode1` | `string` | RA 상위 분류 (BL, HRA 등) |
| `raCode2` | `string` | RA 위험/특성 유형 (OIS, DIS, RW 등) |
| `raCode3` | `string` | RA 개별 주체명 (Lazarus 등) |
| `riskAnalysisType` | `string` | Direct / Tracked |
| `hopCount` | `number` | 추적 홉 수 (0~3) |
| `provider` | `string` | KYT 제공자 |

## 장애 처리 (Fail-open)

| 장애 유형 | 기본 동작 |
|-----------|----------|
| API 타임아웃 | PASS + 경고 로그 |
| API 에러 응답 | PASS + 경고 로그 |
| API 미설정 | PASS + 경고 로그 |

::: danger 규제 요구사항
금융기관의 규제 요구에 따라 fail-close (BLOCK) 정책으로 변경할 수 있습니다.
:::

## 환경변수

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `KYT_API_BASE_URL` | ✅ | — | TranSight KYT API 주소 |
| `KYT_API_KEY` | ✅ | — | KYT API 키 |
| `KYT_BLOCK_THRESHOLD` | ⬜ | `80` | riskScore 기반 BLOCK 임계값 |
| `KYT_WARN_THRESHOLD` | ⬜ | `50` | WARN 임계값 |
| `KYT_TIMEOUT_MS` | ⬜ | `5000` | 타임아웃 (ms) |
| `KYT_DISABLED` | ⬜ | `false` | KYT 전역 비활성화 (테스트용) |

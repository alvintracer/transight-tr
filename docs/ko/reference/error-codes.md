# 에러 코드

## Transfer 거부 사유 (CODE VASP 호환)

| 코드 | 설명 |
|------|------|
| `NOT_FOUND_ADDRESS` | 지갑 주소를 찾을 수 없음 |
| `NOT_SUPPORTED_SYMBOL` | 지원하지 않는 코인 심볼 |
| `NOT_KYC_USER` | KYC 미완료 사용자 |
| `INPUT_NAME_MISMATCHED` | 수신인 이름 불일치 |
| `DOB_MISMATCHED` | 생년월일 불일치 |
| `SANCTION_LIST` | 제재 대상 |
| `LACK_OF_INFORMATION` | 정보 부족 |
| `UNKNOWN` | 기타 사유 |

## TranSight 확장 에러 코드

### 인증 (HTTP 401)
| 코드 | 설명 |
|------|------|
| `AUTH_INVALID_SIGNATURE` | 서명 검증 실패 |
| `AUTH_EXPIRED_NONCE` | Nonce 만료 |
| `AUTH_UNKNOWN_VASP` | 등록되지 않은 VASP |
| `AUTH_KEY_MISMATCH` | 공개키 불일치 |

### KYT (HTTP 403)
| 코드 | 설명 |
|------|------|
| `KYT_BLOCK` | KYT 위험 판정 → PII 전송 차단 |
| `KYT_TIMEOUT` | KYT 조회 시간 초과 |

### 전송 (HTTP 400/404/409)
| 코드 | 설명 |
|------|------|
| `TRANSFER_NOT_FOUND` | Transfer를 찾을 수 없음 |
| `TRANSFER_INVALID_STATUS` | 잘못된 상태 전이 |
| `TRANSFER_DUPLICATE` | 중복 transferId |

### IVMS101 (HTTP 400)
| 코드 | 설명 |
|------|------|
| `IVMS101_INVALID_PAYLOAD` | 잘못된 payload 형식 |
| `IVMS101_DECRYPTION_FAILED` | 복호화 실패 |
| `IVMS101_VALIDATION_FAILED` | 스키마 검증 실패 |

### VASP (HTTP 400/404)
| 코드 | 설명 |
|------|------|
| `VASP_NOT_FOUND` | 수신 VASP를 찾을 수 없음 |
| `VASP_HEALTH_DOWN` | 수신 VASP 상태 비정상 |
| `VASP_KEY_EXPIRED` | 수신 VASP 공개키 만료 |

### 채널 (HTTP 502/504)
| 코드 | 설명 |
|------|------|
| `CHANNEL_ROUTING_FAILED` | 프로토콜 어댑터 라우팅 실패 |
| `CHANNEL_TIMEOUT` | 수신 VASP/프로바이더 응답 시간 초과 |

### GTR (HTTP 502)
| 코드 | 설명 |
|------|------|
| `GTR_NOT_CONFIGURED` | GTR API Key 미설정 |
| `GTR_SERVICE_ERROR` | GTR API 오류 |
| `GTR_FIELD_NOT_SUPPORTED` | 상대 VASP가 요청 PII 필드를 지원하지 않음 |

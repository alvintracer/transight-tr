---
type: concept
date: 2026-08-12
status: draft
topic: VerifyVASP VerifyName protocol structure and non-obliged VASP integration
source:
  - AI-Sessions/raw/VerifyVASP_Intro_250408.pdf
  - https://www.verifyvasp.com/en/products/verify-name/
  - https://docs.verifyvasp.com/reference/verifyname-scenarios-and-flows
  - https://docs.verifyvasp.com/reference/verifyname-to-be-architecture
  - https://docs.verifyvasp.com/reference/verifyname-request-verification
  - https://docs.verifyvasp.com/reference/verifyname-owner-verification
---

# VV VerifyName 구조 해석

## 결론

VerifyName은 엄밀한 Travel Rule 본검증이라기보다, Travel Rule 의무가 없거나 아직 시행되지 않은 jurisdiction의 VASP와 거래할 때 사용하는 enhanced risk mitigation / EDD 성격의 계정주 동일성 확인 프로토콜이다.

핵심 목적은 `originator와 beneficiary wallet owner가 같은 사람인지`를 확인해 1st-party transaction만 허용하는 것이다.

단, `non-obliged VASP`를 `DD가 전혀 안 된 미가입/미확인 VASP`로 이해하면 안 된다. VerifyName이 자동화로 작동하려면 상대 VASP도 VerifyName participant로서 VV network에 식별되어야 하며, current docs 기준으로는 Enclave 설치와 VerifyName API 구현이 필요하다.

## TravelRule / User Account Verification / VerifyName 구분

| 구분 | 목적 | 상대방 | PII 처리 |
|---|---|---|---|
| TravelRule User Account Verification | 수취 주소가 상대 VASP 소유인지 사전 확인 | Travel Rule-obliged / verified VASP | 주소/이름 등 local 구간 평문 가능 |
| TravelRule User Verification | IVMS101 본검증과 PII 교환 | Travel Rule-obliged / verified VASP | 수신 Enclave 공개키로 E2E 암호화 |
| VerifyName Owner Verification | originator와 beneficiary wallet owner가 동일인인지 확인 | non-obliged jurisdiction VASP 포함 | name+DOB 기반 salted hash 비교 |
| WLF/name screening | 제재/PEP/Watchlist 리스크 확인 | screening provider | Refinitiv WCO 등 별도 risk API |

## 우리가 hash해서 보내는 구조인지

정확히는 `우리 backend가 직접 hash를 만들어 VV Central로 보내는 구조`가 아니라, `우리 backend가 Enclave에 name, DOB, address 등 필요한 평문 정보를 넣고, Enclave가 random salt와 hash를 생성해 VV Central로 보내는 구조`로 보는 것이 맞다.

공식 VerifyName flow 기준:

1. 요청 VASP가 자기 Enclave의 `Owner Verification API`를 호출한다.
2. 요청 Enclave가 random salt를 생성한다.
3. 요청 Enclave가 `salt + name + DOB`로 hash를 만든다.
4. salt는 상대 VASP public key로 암호화한다.
5. hash와 encrypted salt, 주소/자산/네트워크/txHash 등 검증 메타데이터가 VV Central을 통해 상대 VASP Enclave로 전달된다.
6. 상대 VASP Enclave는 자기 backend의 `VerifyName API`를 호출한다.
7. 상대 backend는 주소 또는 txHash를 자기 DB에서 찾고, 해당 계정주의 name/DOB를 자기 Enclave에 반환한다.
8. 상대 Enclave가 encrypted salt를 복호화하고, 자기 DB에서 나온 name/DOB로 hash를 재생성한다.
9. 두 hash가 일치하면 owner 동일성이 확인된다.

따라서 VV Central은 routing과 result response를 담당하지만, name/DOB 평문을 받아 비교하는 주체는 아니다.

## Non-Obliged VASP가 해야 하는 일

VerifyName을 지원하려는 non-obliged VASP는 최소한 다음을 해야 한다.

1. VV network에서 식별 가능한 VASP로 등록되어야 한다.
2. current docs 기준으로 자기 infrastructure에 VerifyVASP Enclave를 설치해야 한다.
3. 자기 backend에 VerifyName API를 구현해야 한다.
4. 주소 또는 txHash로 자기 고객/거래를 찾을 수 있어야 한다.
5. 해당 owner의 name/DOB를 자기 Enclave에 반환할 수 있어야 한다.
6. callback API와 result/tx report 흐름을 처리해야 한다.

즉, VerifyName은 `DD가 안 된 아무 VASP에게 이름+생년월일+주소 hash를 던지면 확인해주는 공개 조회망`이 아니다. 상대방이 고객 DB와 지갑주소/txHash 매핑을 가지고 있고, VV Enclave/API 연동을 한 상태여야 자동 확인이 된다.

## Pre / Post Verification

### Pre Verification

Travel Rule-obliged VASP가 출금 전에 non-obliged beneficiary VASP에 대해 계정주 동일성을 확인하는 흐름이다.

```text
Originator at obliged VASP
  -> obliged VASP Enclave creates salted hash(name+DOB)
  -> VV Central routes request
  -> non-obliged VASP Enclave/backend checks beneficiary address owner
  -> non-obliged Enclave compares hash
  -> obliged VASP decides whether to execute withdrawal
```

### Post Verification

Non-obliged VASP가 선출금을 해버린 뒤, obliged beneficiary VASP가 입금 감지 후 originator 동일성을 확인하는 흐름이다.

```text
Non-obliged VASP executes withdrawal first
  -> obliged VASP detects deposit
  -> beneficiary/user selects ordering VASP or ordering VASP is identified
  -> obliged VASP Enclave creates salted hash(name+DOB)
  -> non-obliged VASP checks txHash and retrieves originator owner info
  -> hash comparison result is returned
  -> obliged VASP decides whether to credit deposit
```

## 2025 Intro 이미지와 current docs 차이

`VerifyVASP_Intro_250408.pdf`의 Simplified Travel Rule Exercise 이미지는 non-obliged VASP 쪽에 `Internal Server`와 `Hash Matching`만 크게 표시하고 Enclave를 생략한 형태다.

반면 current VerifyName 2.0 docs는 `All VASPs supporting the VerifyName 2.0 protocol — regardless of Travel Rule obligation status — must install the VerifyVASP Enclave within their infrastructure`라고 설명한다.

따라서 외부 설명에서는 Intro 이미지를 그대로 구현 구조로 단정하지 말고, 다음처럼 표현하는 것이 안전하다.

```text
VerifyName은 non-obliged VASP와도 직접 PII를 교환하지 않고,
각 VASP의 Enclave가 salted hash를 생성/비교해 계정주 동일성을 확인하는 프로토콜이다.
다만 VerifyName 자동화를 위해서는 non-obliged VASP도 VV network 식별, Enclave 설치,
VerifyName API 구현, 고객/주소/txHash 매핑 DB 연동이 필요하다.
```

## 제품 포지셔닝

금융기관 대상 설명에서는 VerifyName을 다음처럼 포지셔닝한다.

```text
Travel Rule-obliged VASP 간 IVMS101 본검증은 TravelRule API로 처리하고,
Travel Rule 의무가 없거나 미시행 지역의 VASP와 거래할 때는 VerifyName으로
name+DOB salted hash 기반 동일인 여부를 확인해 1st-party transfer만 허용한다.
```


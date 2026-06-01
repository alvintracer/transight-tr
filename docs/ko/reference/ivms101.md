# IVMS101 스키마

::: tip
IVMS101은 FATF(국제자금세탁방지기구)가 정의한 가상자산 전송 메시지 표준입니다.
:::

## 최상위 구조

```json
{
  "ivms101": {
    "Originator": { ... },
    "Beneficiary": { ... },
    "OriginatingVASP": { ... },
    "BeneficiaryVASP": { ... }
  }
}
```

## Originator (송신인)

```typescript
interface Originator {
  originatorPersons: Person[];  // 1명 이상 필수
  accountNumber: string[];      // 지갑 주소
}
```

## Beneficiary (수신인)

```typescript
interface Beneficiary {
  beneficiaryPersons: Person[];  // 1명 이상 필수
  accountNumber: string[];       // 지갑 주소
}
```

## Person (자연인 / 법인)

```typescript
interface Person {
  naturalPerson?: NaturalPerson;  // 개인
  legalPerson?: LegalPerson;      // 법인
  // 둘 중 하나만 필수
}
```

## NaturalPerson (자연인)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name.nameIdentifier` | `array` | ✅ | 이름 식별자 (1개 이상) |
| `name.nameIdentifier[].primaryIdentifier` | `string` | ✅ | 성(姓) |
| `name.nameIdentifier[].secondaryIdentifier` | `string` | ⬜ | 이름(名) |
| `name.nameIdentifier[].nameIdentifierType` | `string` | ✅ | `LEGL`, `BIRT`, `MAID`, `ALIA`, `MISC` |
| `dateAndPlaceOfBirth.dateOfBirth` | `string` | ⬜ | YYYY-MM-DD |
| `nationalIdentification` | `object` | ⬜ | 국가 식별 정보 |
| `countryOfResidence` | `string` | ⬜ | ISO 3166-1 alpha-2 |

## LegalPerson (법인)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name.nameIdentifier` | `array` | ✅ | 법인명 식별자 |
| `name.nameIdentifier[].legalPersonName` | `string` | ✅ | 법인명 |
| `name.nameIdentifier[].legalPersonNameIdentifierType` | `string` | ✅ | `LEGL`, `SHRT`, `TRAD` |
| `nationalIdentification` | `object` | ⬜ | 국가 식별 정보 |
| `countryOfRegistration` | `string` | ⬜ | ISO 3166-1 alpha-2 |

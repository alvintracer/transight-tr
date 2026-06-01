# IVMS101 Schema

::: tip
IVMS101 is the virtual asset transfer message standard defined by FATF (Financial Action Task Force).
:::

## Top-Level Structure

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

## Originator

```typescript
interface Originator {
  originatorPersons: Person[];  // At least 1 required
  accountNumber: string[];      // Wallet addresses
}
```

## Beneficiary

```typescript
interface Beneficiary {
  beneficiaryPersons: Person[];  // At least 1 required
  accountNumber: string[];       // Wallet addresses
}
```

## Person (Natural / Legal)

```typescript
interface Person {
  naturalPerson?: NaturalPerson;  // Individual
  legalPerson?: LegalPerson;      // Entity
  // Exactly one is required
}
```

## NaturalPerson

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name.nameIdentifier` | `array` | ✅ | Name identifiers (1+) |
| `name.nameIdentifier[].primaryIdentifier` | `string` | ✅ | Surname |
| `name.nameIdentifier[].secondaryIdentifier` | `string` | ⬜ | Given name |
| `name.nameIdentifier[].nameIdentifierType` | `string` | ✅ | `LEGL`, `BIRT`, `MAID`, `ALIA`, `MISC` |
| `dateAndPlaceOfBirth.dateOfBirth` | `string` | ⬜ | YYYY-MM-DD |
| `nationalIdentification` | `object` | ⬜ | National ID info |
| `countryOfResidence` | `string` | ⬜ | ISO 3166-1 alpha-2 |

## LegalPerson

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name.nameIdentifier` | `array` | ✅ | Legal name identifiers |
| `name.nameIdentifier[].legalPersonName` | `string` | ✅ | Legal name |
| `name.nameIdentifier[].legalPersonNameIdentifierType` | `string` | ✅ | `LEGL`, `SHRT`, `TRAD` |
| `nationalIdentification` | `object` | ⬜ | National ID info |
| `countryOfRegistration` | `string` | ⬜ | ISO 3166-1 alpha-2 |

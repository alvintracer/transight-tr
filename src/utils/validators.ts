/**
 * IVMS101 검증 유틸리티
 * CODE VASP json-schema.json 기반 런타임 검증
 * 
 * @see reference/codevasp-skills/skills/codevasp-core/references/schemas/json-schema.json
 */

import type {
  IVMS101Message,
  IVMS101Payload,
  NaturalPerson,
  LegalPerson,
  Originator,
  Beneficiary,
  Person,
} from '../types/ivms101.js';

// ============================================================
// Validation Result
// ============================================================

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

function ok(): ValidationResult {
  return { valid: true, errors: [] };
}

function fail(errors: ValidationError[]): ValidationResult {
  return { valid: false, errors };
}

// ============================================================
// Field Validators
// ============================================================

/** ISO 3166-1 alpha-2 국가 코드 패턴 */
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

/** 날짜 패턴 (YYYY-MM-DD) */
const DATE_PATTERN = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;

/** 등록 기관 코드 패턴 (RA + 6자리) */
const REG_AUTHORITY_PATTERN = /^RA([0-9]{6})$/;

function validateCountryCode(value: string | undefined, field: string): ValidationError[] {
  if (!value) return [];
  if (!COUNTRY_CODE_PATTERN.test(value)) {
    return [{ field, message: `Invalid country code: must be ISO 3166-1 alpha-2 (got "${value}")`, value }];
  }
  return [];
}

function validateDate(value: string | undefined, field: string): ValidationError[] {
  if (!value) return [];
  if (!DATE_PATTERN.test(value)) {
    return [{ field, message: `Invalid date format: must be YYYY-MM-DD (got "${value}")`, value }];
  }
  return [];
}

function validateStringLength(
  value: string | undefined,
  field: string,
  maxLength: number,
  minLength = 1
): ValidationError[] {
  if (!value) return [];
  if (value.length < minLength || value.length > maxLength) {
    return [{
      field,
      message: `String length out of range: ${minLength}-${maxLength} (got ${value.length})`,
      value,
    }];
  }
  return [];
}

// ============================================================
// Person Validators
// ============================================================

function validateNaturalPerson(person: NaturalPerson, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // name은 필수
  if (!person.name) {
    errors.push({ field: `${path}.name`, message: 'NaturalPerson.name is required' });
  } else {
    if (!person.name.nameIdentifier || person.name.nameIdentifier.length === 0) {
      errors.push({
        field: `${path}.name.nameIdentifier`,
        message: 'At least one nameIdentifier is required',
      });
    } else {
      person.name.nameIdentifier.forEach((ni, i) => {
        errors.push(...validateStringLength(ni.primaryIdentifier, `${path}.name.nameIdentifier[${i}].primaryIdentifier`, 100));
        if (!ni.primaryIdentifier) {
          errors.push({
            field: `${path}.name.nameIdentifier[${i}].primaryIdentifier`,
            message: 'primaryIdentifier is required',
          });
        }
      });
    }
  }

  // dateAndPlaceOfBirth
  if (person.dateAndPlaceOfBirth) {
    errors.push(...validateDate(person.dateAndPlaceOfBirth.dateOfBirth, `${path}.dateAndPlaceOfBirth.dateOfBirth`));
  }

  // countryOfResidence
  errors.push(...validateCountryCode(person.countryOfResidence, `${path}.countryOfResidence`));

  // customerIdentification
  errors.push(...validateStringLength(person.customerIdentification, `${path}.customerIdentification`, 50));

  return errors;
}

function validateLegalPerson(person: LegalPerson, path: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // name은 필수
  if (!person.name) {
    errors.push({ field: `${path}.name`, message: 'LegalPerson.name is required' });
  } else {
    if (!person.name.nameIdentifier || person.name.nameIdentifier.length === 0) {
      errors.push({
        field: `${path}.name.nameIdentifier`,
        message: 'At least one nameIdentifier is required for LegalPerson',
      });
    } else {
      person.name.nameIdentifier.forEach((ni, i) => {
        errors.push(...validateStringLength(ni.legalPersonName, `${path}.name.nameIdentifier[${i}].legalPersonName`, 100));
        if (!ni.legalPersonName) {
          errors.push({
            field: `${path}.name.nameIdentifier[${i}].legalPersonName`,
            message: 'legalPersonName is required',
          });
        }
      });
    }
  }

  // countryOfRegistration
  errors.push(...validateCountryCode(person.countryOfRegistration, `${path}.countryOfRegistration`));

  // nationalIdentification
  if (person.nationalIdentification?.registrationAuthority) {
    if (!REG_AUTHORITY_PATTERN.test(person.nationalIdentification.registrationAuthority)) {
      errors.push({
        field: `${path}.nationalIdentification.registrationAuthority`,
        message: `Must match pattern RA + 6 digits (got "${person.nationalIdentification.registrationAuthority}")`,
        value: person.nationalIdentification.registrationAuthority,
      });
    }
  }

  return errors;
}

function validatePerson(person: Person, path: string): ValidationError[] {
  if (person.naturalPerson && person.legalPerson) {
    return [{
      field: path,
      message: 'Person must have either naturalPerson or legalPerson, not both',
    }];
  }
  if (!person.naturalPerson && !person.legalPerson) {
    return [{
      field: path,
      message: 'Person must have either naturalPerson or legalPerson',
    }];
  }

  if (person.naturalPerson) {
    return validateNaturalPerson(person.naturalPerson, `${path}.naturalPerson`);
  }
  if (person.legalPerson) {
    return validateLegalPerson(person.legalPerson, `${path}.legalPerson`);
  }

  return [];
}

// ============================================================
// Top-Level Validators
// ============================================================

function validateOriginator(originator: Originator): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!originator.originatorPersons || originator.originatorPersons.length === 0) {
    errors.push({
      field: 'Originator.originatorPersons',
      message: 'At least one originator person is required',
    });
  } else {
    originator.originatorPersons.forEach((p, i) => {
      errors.push(...validatePerson(p, `Originator.originatorPersons[${i}]`));
    });
  }

  if (!originator.accountNumber || originator.accountNumber.length === 0) {
    errors.push({
      field: 'Originator.accountNumber',
      message: 'At least one account number (wallet address) is required',
    });
  }

  return errors;
}

function validateBeneficiary(beneficiary: Beneficiary): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!beneficiary.beneficiaryPersons || beneficiary.beneficiaryPersons.length === 0) {
    errors.push({
      field: 'Beneficiary.beneficiaryPersons',
      message: 'At least one beneficiary person is required',
    });
  } else {
    beneficiary.beneficiaryPersons.forEach((p, i) => {
      errors.push(...validatePerson(p, `Beneficiary.beneficiaryPersons[${i}]`));
    });
  }

  if (!beneficiary.accountNumber || beneficiary.accountNumber.length === 0) {
    errors.push({
      field: 'Beneficiary.accountNumber',
      message: 'At least one account number (wallet address) is required',
    });
  }

  return errors;
}

// ============================================================
// Public API
// ============================================================

/**
 * IVMS101 메시지 검증
 * CODE VASP JSON Schema 기반 런타임 검증
 * 
 * @param message IVMS101 메시지 객체
 * @returns 검증 결과
 */
export function validateIVMS101(message: IVMS101Message): ValidationResult {
  const errors: ValidationError[] = [];

  // 필수 최상위 필드 검증
  if (!message.Originator) {
    errors.push({ field: 'Originator', message: 'Originator is required' });
  } else {
    errors.push(...validateOriginator(message.Originator));
  }

  if (!message.Beneficiary) {
    errors.push({ field: 'Beneficiary', message: 'Beneficiary is required' });
  } else {
    errors.push(...validateBeneficiary(message.Beneficiary));
  }

  if (!message.OriginatingVASP) {
    errors.push({ field: 'OriginatingVASP', message: 'OriginatingVASP is required' });
  } else if (message.OriginatingVASP.originatingVASP) {
    errors.push(...validatePerson(
      message.OriginatingVASP.originatingVASP,
      'OriginatingVASP.originatingVASP'
    ));
  }

  if (message.BeneficiaryVASP?.beneficiaryVASP) {
    errors.push(...validatePerson(
      message.BeneficiaryVASP.beneficiaryVASP,
      'BeneficiaryVASP.beneficiaryVASP'
    ));
  }

  return errors.length > 0 ? fail(errors) : ok();
}

/**
 * IVMS101 Payload 검증 (wrapper 포함)
 * 
 * @param payload IVMS101 payload 객체 (ivms101 키 포함)
 * @returns 검증 결과
 */
export function validateIVMS101Payload(payload: IVMS101Payload): ValidationResult {
  if (!payload.ivms101) {
    return fail([{ field: 'ivms101', message: 'ivms101 wrapper is required' }]);
  }
  return validateIVMS101(payload.ivms101);
}

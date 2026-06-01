/**
 * IVMS101 TypeScript 타입 정의
 * CODE VASP json-schema.json 기반 변환
 * @see reference/codevasp-skills/skills/codevasp-core/references/schemas/json-schema.json
 */

// ============================================================
// Enum Types
// ============================================================

/** 자연인 이름 유형 코드 */
export type NaturalPersonNameTypeCode = 'ALIA' | 'BIRT' | 'MAID' | 'LEGL' | 'MISC';

/** 법인 이름 유형 코드 */
export type LegalPersonNameTypeCode = 'LEGL' | 'SHRT' | 'TRAD';

/** 주소 유형 코드 */
export type AddressTypeCode = 'HOME' | 'BIZZ' | 'GEOG';

/** 국가 식별자 유형 코드 */
export type NationalIdentifierTypeCode =
  | 'ARNU'   // Alien Registration Number
  | 'CCPT'   // Passport Number
  | 'RAID'   // Registration Authority Identifier
  | 'DRLC'   // Driver's License Number
  | 'FIIN'   // Foreign Investment Identity Number
  | 'TXID'   // Tax Identification Number
  | 'SOCS'   // Social Security Number
  | 'IDCD'   // Identity Card Number
  | 'LEIX'   // Legal Entity Identifier
  | 'MISC';  // Miscellaneous

// ============================================================
// Base Types
// ============================================================

/** 주소 */
export interface Address {
  addressType?: AddressTypeCode;
  department?: string;
  subDepartment?: string;
  streetName?: string;
  buildingNumber?: string;
  buildingName?: string;
  floor?: string;
  postBox?: string;
  room?: string;
  postCode?: string;
  townName?: string;
  townLocationName?: string;
  districtName?: string;
  countrySubDivision?: string;
  addressLine?: string[];
  country?: string; // ISO 3166-1 alpha-2 (e.g., "KR")
}

/** 국가 식별 정보 */
export interface NationalIdentification {
  nationalIdentifier?: string;
  nationalIdentifierType?: NationalIdentifierTypeCode;
  countryOfIssue?: string; // ISO 3166-1 alpha-2
  registrationAuthority?: string; // Pattern: RA + 6 digits
}

/** 생년월일 및 출생지 */
export interface DateAndPlaceOfBirth {
  dateOfBirth?: string; // Pattern: YYYY-MM-DD
  placeOfBirth?: string;
}

// ============================================================
// Name Types
// ============================================================

/** 자연인 이름 식별자 */
export interface NaturalPersonNameId {
  primaryIdentifier: string;
  secondaryIdentifier?: string;
  nameIdentifierType: NaturalPersonNameTypeCode;
}

/** 자연인 로컬 이름 식별자 (현지 문자) */
export interface LocalNaturalPersonNameId {
  primaryIdentifier: string;
  secondaryIdentifier?: string;
  nameIdentifierType?: NaturalPersonNameTypeCode;
}

/** 자연인 이름 */
export interface NaturalPersonName {
  nameIdentifier: NaturalPersonNameId[];
  localNameIdentifier?: LocalNaturalPersonNameId[];
  phoneticNameIdentifier?: LocalNaturalPersonNameId[];
}

/** 법인 이름 식별자 */
export interface LegalPersonNameId {
  legalPersonName: string;
  legalPersonNameIdentifierType: LegalPersonNameTypeCode;
}

/** 법인 로컬 이름 식별자 */
export interface LocalLegalPersonNameId {
  legalPersonName: string;
  legalPersonNameIdentifierType?: LegalPersonNameTypeCode;
}

/** 법인 이름 */
export interface LegalPersonName {
  nameIdentifier: LegalPersonNameId[];
  localNameIdentifier?: LocalLegalPersonNameId[];
  phoneticNameIdentifier?: LocalLegalPersonNameId[];
}

// ============================================================
// Person Types
// ============================================================

/** 자연인 (개인) */
export interface NaturalPerson {
  name: NaturalPersonName;
  geographicAddress?: Address[];
  nationalIdentification?: NationalIdentification;
  customerIdentification?: string;
  dateAndPlaceOfBirth?: DateAndPlaceOfBirth;
  countryOfResidence?: string; // ISO 3166-1 alpha-2
}

/** 법인 */
export interface LegalPerson {
  name: LegalPersonName;
  geographicAddress?: Address[];
  customerNumber?: string;
  nationalIdentification?: NationalIdentification;
  countryOfRegistration?: string; // ISO 3166-1 alpha-2
}

/** Person (자연인 또는 법인 중 하나) */
export interface Person {
  naturalPerson?: NaturalPerson;
  legalPerson?: LegalPerson;
}

// ============================================================
// IVMS101 Top-Level Structures
// ============================================================

/** 송신인 (Originator) */
export interface Originator {
  originatorPersons: Person[];
  accountNumber: string[]; // 지갑 주소 (format: "address:tag_or_memo")
}

/** 수신인 (Beneficiary) */
export interface Beneficiary {
  beneficiaryPersons: Person[];
  accountNumber: string[]; // 지갑 주소
}

/** 송신 VASP */
export interface OriginatingVASP {
  originatingVASP?: Person;
}

/** 수신 VASP */
export interface BeneficiaryVASP {
  beneficiaryVASP?: Person;
}

/** IVMS101 최상위 메시지 구조 */
export interface IVMS101Message {
  Originator: Originator;
  Beneficiary: Beneficiary;
  OriginatingVASP: OriginatingVASP;
  BeneficiaryVASP?: BeneficiaryVASP;
}

/** IVMS101 Payload Wrapper (암호화 전) */
export interface IVMS101Payload {
  ivms101: IVMS101Message;
}

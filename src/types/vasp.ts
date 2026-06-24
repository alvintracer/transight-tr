/**
 * VASP 레지스트리 타입 정의
 * TranSight Hub의 VASP 관리 타입
 */

// ============================================================
// Channel Types
// ============================================================

/** 연결 채널 유형 */
export enum ChannelType {
  /** 일반 TLS + AES256 + OAuth (해외 VASP) */
  HTTPS = 'HTTPS',
  /** 상호 인증서 + OAuth (간편결제사, 인터넷전문은행) */
  MTLS = 'mTLS',
  /** IPSec 암호화 터널 (보수적 은행) */
  VPN = 'VPN',
  /** 물리적 전용선 (TranSafer 기구축 은행) */
  LEASED_LINE = 'LEASED_LINE',
}

/** TR 솔루션 얼라이언스 */
export enum AllianceName {
  CODE = 'code',
  VERIFY_VASP = 'verifyvasp',
  TRANSIGHT = 'transight',
  SUMSUB = 'sumsub',
  DIRECT = 'direct',  // 직접 연동 (Bybit, Bitget 등)
  GTR = 'gtr',        // Global Travel Rule (Binance, OKX, Bybit 등)
}

// ============================================================
// VASP Records
// ============================================================

/** VASP 레지스트리 레코드 (DB 행 매핑) */
export interface VaspRecord {
  id: string;                              // UUID
  vasp_entity_id: string;                  // CODE: vaspEntityId / 고유 식별자
  vasp_name: string;                       // 표시 이름
  vasp_legal_name?: string;                // 법적 등록명
  country_of_registration?: string;        // ISO 3166-1 alpha-2
  alliance_name: AllianceName | string;    // TR 솔루션
  endpoint_url?: string;                   // TR API 엔드포인트
  channel_type: ChannelType;               // 연결 채널
  health: 'up' | 'down';
  metadata?: Record<string, unknown>;      // 추가 메타데이터
  created_at: string;
  updated_at: string;
}

/** 공개키 레코드 (DB 행 매핑) */
export interface PublicKeyRecord {
  id: string;
  vasp_id: string;                         // FK → vasps.id
  public_key: string;                      // Base64 Ed25519 verify key
  algorithm: string;                       // 기본: 'Ed25519'
  expires_at?: string;                     // ISO8601 UTC
  is_active: boolean;
  created_at: string;
}

// ============================================================
// API Input/Output Types
// ============================================================

/** VASP 등록 입력 */
export interface VaspRegistrationInput {
  vasp_entity_id: string;
  vasp_name: string;
  vasp_legal_name?: string;
  country_of_registration: string;
  alliance_name?: string;
  endpoint_url: string;
  channel_type?: ChannelType;
  public_key: string;
  public_key_expires_at?: string;
}

/** VASP 검색 필터 */
export interface VaspSearchFilter {
  alliance_name?: string;
  country?: string;
  health?: 'up' | 'down';
  search?: string;  // 이름 검색
}

/** VASP 조회 응답 (공개키 포함) */
export interface VaspWithKeys extends VaspRecord {
  public_keys: PublicKeyRecord[];
}

/**
 * CODE VASP 헤더 서명 생성/검증 유틸리티
 * 
 * 서명 규칙:
 * concat(X-Code-Req-Datetime, Body, X-Code-Req-Nonce) → Ed25519 서명
 * 
 * @see reference/codevasp-skills/skills/codevasp-core/references/guides/02-Development/03-Header-Parameter.md
 */

import { sign, verify, getVerifyKey } from './nacl-crypto.js';
import naclUtil from 'tweetnacl-util';

import type { CodeVaspRequestHeaders } from '../types/code-api.js';

// ============================================================
// Nonce Helper
// ============================================================

/**
 * Nonce를 Big-Endian 4바이트 배열로 변환
 * CODE VASP 서명 규칙에서 nonce는 4바이트 Big-Endian unsigned integer
 */
function nonceToBytes(nonce: number): Uint8Array {
  const result = new Uint8Array(4);
  result[0] = (nonce >> 24) & 0xFF;
  result[1] = (nonce >> 16) & 0xFF;
  result[2] = (nonce >> 8) & 0xFF;
  result[3] = nonce & 0xFF;
  return result;
}

/**
 * 랜덤 nonce 생성
 * CODE VASP: 100초 이내 중복 불가
 */
function generateNonce(): number {
  return Math.floor(Math.random() * 2147483647);
}

// ============================================================
// Signature Data Construction
// ============================================================

/**
 * 서명 대상 데이터 생성
 * concat(datetime_bytes, body_bytes, nonce_bytes)
 * 
 * @param datetime ISO8601 UTC datetime string
 * @param body 요청 본문 (JSON string)
 * @param nonce 논스 (unsigned integer)
 */
function buildSignatureData(
  datetime: string,
  body: string,
  nonce: number
): Uint8Array {
  const datetimeBytes = new TextEncoder().encode(datetime);
  const bodyBytes = new TextEncoder().encode(body);
  const nonceBytes = nonceToBytes(nonce);

  const data = new Uint8Array(datetimeBytes.length + bodyBytes.length + nonceBytes.length);
  data.set(datetimeBytes, 0);
  data.set(bodyBytes, datetimeBytes.length);
  data.set(nonceBytes, datetimeBytes.length + bodyBytes.length);

  return data;
}

// ============================================================
// Header Generation
// ============================================================

/** 헤더 생성 옵션 */
export interface CreateHeadersOptions {
  /** Ed25519 private key (Base64, 64 bytes) */
  privateKey: string;
  /** 자신의 VASP entity ID */
  vaspEntityId: string;
  /** 요청 본문 (JSON string) */
  body: string;
  /** 수신 VASP 공개키 (Base64, 암호화 API에서만 필요) */
  remotePublicKey?: string;
  /** 얼라이언스 이름 (기본: 'code') */
  allianceName?: string;
}

/**
 * CODE VASP API 요청 헤더 생성
 * 
 * @param options 헤더 생성 옵션
 * @returns CODE VASP 헤더 객체
 */
export function createRequestHeaders(options: CreateHeadersOptions): CodeVaspRequestHeaders {
  const {
    privateKey,
    vaspEntityId,
    body,
    remotePublicKey,
    allianceName = 'code',
  } = options;

  const datetime = new Date().toISOString();
  const nonce = generateNonce();

  // 서명 데이터 생성
  const signatureData = buildSignatureData(datetime, body, nonce);

  // Ed25519 서명
  const signature = sign(signatureData, privateKey);
  const publicKey = getVerifyKey(privateKey);

  const headers: CodeVaspRequestHeaders = {
    'X-Code-Req-Datetime': datetime,
    'X-Code-Req-Nonce': nonce.toString(),
    'X-Code-Req-PubKey': publicKey,
    'X-Code-Req-Signature': naclUtil.encodeBase64(signature),
    'X-Request-Origin': `${allianceName}:${vaspEntityId}`,
  };

  if (remotePublicKey) {
    headers['X-Code-Req-Remote-PubKey'] = remotePublicKey;
  }

  return headers;
}

// ============================================================
// Signature Verification
// ============================================================

/** 서명 검증 옵션 */
export interface VerifySignatureOptions {
  /** X-Code-Req-Datetime 헤더 값 */
  datetime: string;
  /** 요청 본문 (JSON string) */
  body: string;
  /** X-Code-Req-Nonce 헤더 값 */
  nonce: string;
  /** X-Code-Req-Signature 헤더 값 (Base64) */
  signature: string;
  /** X-Code-Req-PubKey 헤더 값 (Base64) */
  publicKey: string;
}

/**
 * 수신된 요청의 서명 검증
 * 
 * @param options 검증 옵션
 * @returns 서명 유효 여부
 */
export function verifyRequestSignature(options: VerifySignatureOptions): boolean {
  const { datetime, body, nonce, signature, publicKey } = options;

  const nonceNum = parseInt(nonce, 10);
  if (isNaN(nonceNum)) {
    return false;
  }

  const signatureData = buildSignatureData(datetime, body, nonceNum);
  const signatureBytes = naclUtil.decodeBase64(signature);

  return verify(signatureData, signatureBytes, publicKey);
}

/**
 * X-Request-Origin 파싱
 * @param origin "code:coinone" 형태의 문자열
 * @returns { allianceName, vaspEntityId }
 */
export function parseRequestOrigin(origin: string): {
  allianceName: string;
  vaspEntityId: string;
} {
  const colonIndex = origin.indexOf(':');
  if (colonIndex === -1) {
    throw new Error(`Invalid X-Request-Origin format: ${origin}`);
  }
  return {
    allianceName: origin.slice(0, colonIndex),
    vaspEntityId: origin.slice(colonIndex + 1),
  };
}

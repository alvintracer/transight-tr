/**
 * NaCl 기반 암호화/복호화 유틸리티
 * CODE VASP의 codeCrypto.js를 TypeScript로 포팅
 * 
 * 알고리즘:
 * - 키교환: X25519 (Ed25519 → Curve25519 변환)
 * - 암호화: XSalsa20-Poly1305 (NaCl Box)
 * - 서명: Ed25519
 * 
 * @see reference/codevasp-skills/skills/codevasp-core/references/guides/02-Development/02-Encryption-Decryption.md
 * @see reference/codevasp-skills/skills/codevasp-core/references/samples/nodejs/
 */

import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import _sodium from 'libsodium-wrappers';

// ============================================================
// Initialization
// ============================================================

let sodiumReady = false;

/** libsodium 초기화 (첫 사용 전 반드시 호출) */
export async function initSodium(): Promise<void> {
  if (!sodiumReady) {
    await _sodium.ready;
    sodiumReady = true;
  }
}

// ============================================================
// Key Management
// ============================================================

/** Ed25519 키쌍 (서명용) */
export interface Ed25519KeyPair {
  /** Private key (signing key) — 64 bytes → Base64 */
  privateKey: string;
  /** Public key (verify key) — 32 bytes → Base64 */
  publicKey: string;
}

/**
 * Ed25519 키쌍 생성
 * @returns Base64 인코딩된 키쌍
 */
export function generateKeyPair(): Ed25519KeyPair {
  const keyPair = nacl.sign.keyPair();
  return {
    privateKey: naclUtil.encodeBase64(keyPair.secretKey),
    publicKey: naclUtil.encodeBase64(keyPair.publicKey),
  };
}

/**
 * Ed25519 signing key에서 verify key(public key) 추출
 * @param b64PrivateKey Base64 인코딩된 signing key (64 bytes)
 * @returns Base64 인코딩된 verify key (32 bytes)
 */
export function getVerifyKey(b64PrivateKey: string): string {
  const secretKey = naclUtil.decodeBase64(b64PrivateKey);
  // Ed25519 secret key의 마지막 32바이트가 public key
  const publicKey = secretKey.slice(32);
  return naclUtil.encodeBase64(publicKey);
}

/**
 * Ed25519 verify key → Curve25519 public key 변환
 * NaCl Box 암호화에 사용
 */
async function ed25519ToCurve25519PublicKey(
  ed25519PublicKey: Uint8Array
): Promise<Uint8Array> {
  await initSodium();
  return _sodium.crypto_sign_ed25519_pk_to_curve25519(ed25519PublicKey);
}

/**
 * Ed25519 signing key → Curve25519 private key 변환
 * NaCl Box 복호화에 사용
 */
async function ed25519ToCurve25519PrivateKey(
  ed25519PrivateKey: Uint8Array
): Promise<Uint8Array> {
  await initSodium();
  return _sodium.crypto_sign_ed25519_sk_to_curve25519(ed25519PrivateKey);
}

// ============================================================
// Encryption / Decryption (NaCl Box)
// ============================================================

/**
 * NaCl Box 암호화
 * 송신 VASP가 수신 VASP의 공개키로 IVMS101 payload를 암호화
 * 
 * @param plaintext 평문 데이터 (UTF-8 문자열 또는 Uint8Array)
 * @param senderPrivateKeyB64 송신자 Ed25519 private key (Base64)
 * @param receiverPublicKeyB64 수신자 Ed25519 public key (Base64)
 * @returns 암호화된 데이터 (nonce + ciphertext)
 */
export async function encrypt(
  plaintext: string | Uint8Array,
  senderPrivateKeyB64: string,
  receiverPublicKeyB64: string
): Promise<Uint8Array> {
  await initSodium();

  const messageBytes = typeof plaintext === 'string'
    ? naclUtil.decodeUTF8(plaintext)
    : plaintext;

  // Ed25519 → Curve25519 변환
  const senderEd25519Sk = naclUtil.decodeBase64(senderPrivateKeyB64);
  const receiverEd25519Pk = naclUtil.decodeBase64(receiverPublicKeyB64);

  const senderCurve25519Sk = await ed25519ToCurve25519PrivateKey(senderEd25519Sk);
  const receiverCurve25519Pk = await ed25519ToCurve25519PublicKey(receiverEd25519Pk);

  // NaCl Box 암호화
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const encrypted = nacl.box(messageBytes, nonce, receiverCurve25519Pk, senderCurve25519Sk);

  if (!encrypted) {
    throw new Error('Encryption failed');
  }

  // nonce + ciphertext 결합
  const result = new Uint8Array(nonce.length + encrypted.length);
  result.set(nonce);
  result.set(encrypted, nonce.length);

  return result;
}

/**
 * NaCl Box 복호화
 * 수신 VASP가 송신 VASP의 공개키로 IVMS101 payload를 복호화
 * 
 * @param ciphertext 암호화된 데이터 (nonce + ciphertext)
 * @param senderPublicKeyB64 송신자 Ed25519 public key (Base64)
 * @param receiverPrivateKeyB64 수신자 Ed25519 private key (Base64)
 * @returns 복호화된 데이터
 */
export async function decrypt(
  ciphertext: Uint8Array,
  senderPublicKeyB64: string,
  receiverPrivateKeyB64: string
): Promise<Uint8Array> {
  await initSodium();

  // nonce + ciphertext 분리
  const nonce = ciphertext.slice(0, nacl.box.nonceLength);
  const message = ciphertext.slice(nacl.box.nonceLength);

  // Ed25519 → Curve25519 변환
  const senderEd25519Pk = naclUtil.decodeBase64(senderPublicKeyB64);
  const receiverEd25519Sk = naclUtil.decodeBase64(receiverPrivateKeyB64);

  const senderCurve25519Pk = await ed25519ToCurve25519PublicKey(senderEd25519Pk);
  const receiverCurve25519Sk = await ed25519ToCurve25519PrivateKey(receiverEd25519Sk);

  // NaCl Box 복호화
  const decrypted = nacl.box.open(message, nonce, senderCurve25519Pk, receiverCurve25519Sk);

  if (!decrypted) {
    throw new Error('Decryption failed — invalid ciphertext or wrong keys');
  }

  return decrypted;
}

/**
 * IVMS101 Payload 암호화 (CODE VASP 프로토콜용)
 * 
 * @param ivms101Json IVMS101 JSON 객체 또는 문자열
 * @param senderPrivateKeyB64 송신자 private key
 * @param receiverPublicKeyB64 수신자 public key
 * @returns Base64 인코딩된 암호화 payload
 */
export async function encryptPayload(
  ivms101Json: unknown,
  senderPrivateKeyB64: string,
  receiverPublicKeyB64: string
): Promise<string> {
  const plaintext = typeof ivms101Json === 'string'
    ? ivms101Json
    : JSON.stringify(ivms101Json);

  const encrypted = await encrypt(plaintext, senderPrivateKeyB64, receiverPublicKeyB64);
  return naclUtil.encodeBase64(encrypted);
}

/**
 * IVMS101 Payload 복호화 (CODE VASP 프로토콜용)
 * 
 * @param b64Payload Base64 인코딩된 암호화 payload
 * @param senderPublicKeyB64 송신자 public key
 * @param receiverPrivateKeyB64 수신자 private key
 * @returns 복호화된 IVMS101 JSON 문자열
 */
export async function decryptPayload(
  b64Payload: string,
  senderPublicKeyB64: string,
  receiverPrivateKeyB64: string
): Promise<string> {
  const ciphertext = naclUtil.decodeBase64(b64Payload);
  const decrypted = await decrypt(ciphertext, senderPublicKeyB64, receiverPrivateKeyB64);
  return naclUtil.encodeUTF8(decrypted);
}

// ============================================================
// Digital Signature (Ed25519)
// ============================================================

/**
 * Ed25519 서명 생성
 * 
 * @param data 서명할 데이터
 * @param privateKeyB64 Ed25519 signing key (Base64, 64 bytes)
 * @returns 서명 (64 bytes)
 */
export function sign(data: Uint8Array, privateKeyB64: string): Uint8Array {
  const secretKey = naclUtil.decodeBase64(privateKeyB64);
  const signature = nacl.sign.detached(data, secretKey);
  return signature;
}

/**
 * Ed25519 서명 검증
 * 
 * @param data 원본 데이터
 * @param signature 서명 (64 bytes)
 * @param publicKeyB64 Ed25519 verify key (Base64, 32 bytes)
 * @returns 검증 결과
 */
export function verify(
  data: Uint8Array,
  signature: Uint8Array,
  publicKeyB64: string
): boolean {
  const publicKey = naclUtil.decodeBase64(publicKeyB64);
  return nacl.sign.detached.verify(data, signature, publicKey);
}

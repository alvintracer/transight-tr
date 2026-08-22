import { createRequire } from 'node:module';
import type sodiumDefault from 'libsodium-wrappers';

const require = createRequire(import.meta.url);
const sodium = require('libsodium-wrappers') as typeof sodiumDefault;

export interface Ed25519KeyPair {
  privateKey: string;
  publicKey: string;
}

let sodiumReady = false;

export async function ready(): Promise<void> {
  if (!sodiumReady) {
    await sodium.ready;
    sodiumReady = true;
  }
}

export function toBase64(bytes: Uint8Array): string {
  return sodium.to_base64(bytes, sodium.base64_variants.ORIGINAL);
}

export function fromBase64(value: string): Uint8Array {
  return sodium.from_base64(value, sodium.base64_variants.ORIGINAL);
}

export async function generateKeyPair(): Promise<Ed25519KeyPair> {
  await ready();
  const keyPair = sodium.crypto_sign_keypair();
  return {
    privateKey: toBase64(keyPair.privateKey),
    publicKey: toBase64(keyPair.publicKey),
  };
}

export async function getPublicKey(privateKeyBase64: string): Promise<string> {
  await ready();
  const privateKey = fromBase64(privateKeyBase64);
  if (privateKey.length < 64) {
    throw new Error('Ed25519 private key must be a 64-byte signing key');
  }
  return toBase64(privateKey.slice(32, 64));
}

export async function signDetached(data: Uint8Array, privateKeyBase64: string): Promise<string> {
  await ready();
  const privateKey = fromBase64(privateKeyBase64);
  const signature = sodium.crypto_sign_detached(data, privateKey);
  return toBase64(signature);
}

export async function verifyDetached(
  data: Uint8Array,
  signatureBase64: string,
  publicKeyBase64: string
): Promise<boolean> {
  await ready();
  return sodium.crypto_sign_verify_detached(
    fromBase64(signatureBase64),
    data,
    fromBase64(publicKeyBase64)
  );
}

export async function encrypt(
  plaintext: string | Uint8Array,
  senderPrivateKeyBase64: string,
  receiverPublicKeyBase64: string
): Promise<Uint8Array> {
  await ready();
  const message = typeof plaintext === 'string'
    ? new TextEncoder().encode(plaintext)
    : plaintext;
  const senderPrivateKey = sodium.crypto_sign_ed25519_sk_to_curve25519(
    fromBase64(senderPrivateKeyBase64)
  );
  const receiverPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(
    fromBase64(receiverPublicKeyBase64)
  );
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const ciphertext = sodium.crypto_box_easy(message, nonce, receiverPublicKey, senderPrivateKey);
  const output = new Uint8Array(nonce.length + ciphertext.length);
  output.set(nonce, 0);
  output.set(ciphertext, nonce.length);
  return output;
}

export async function decrypt(
  encrypted: Uint8Array,
  senderPublicKeyBase64: string,
  receiverPrivateKeyBase64: string
): Promise<Uint8Array> {
  await ready();
  const nonceLength = sodium.crypto_box_NONCEBYTES;
  if (encrypted.length <= nonceLength) {
    throw new Error('Encrypted payload is shorter than the NaCl box nonce');
  }
  const nonce = encrypted.slice(0, nonceLength);
  const ciphertext = encrypted.slice(nonceLength);
  const senderPublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(
    fromBase64(senderPublicKeyBase64)
  );
  const receiverPrivateKey = sodium.crypto_sign_ed25519_sk_to_curve25519(
    fromBase64(receiverPrivateKeyBase64)
  );
  return sodium.crypto_box_open_easy(ciphertext, nonce, senderPublicKey, receiverPrivateKey);
}

export async function encryptPayload(
  payload: unknown,
  senderPrivateKeyBase64: string,
  receiverPublicKeyBase64: string
): Promise<string> {
  const plaintext = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const encrypted = await encrypt(plaintext, senderPrivateKeyBase64, receiverPublicKeyBase64);
  return toBase64(encrypted);
}

export async function decryptPayload(
  payloadBase64: string,
  senderPublicKeyBase64: string,
  receiverPrivateKeyBase64: string
): Promise<string> {
  const plaintext = await decrypt(
    fromBase64(payloadBase64),
    senderPublicKeyBase64,
    receiverPrivateKeyBase64
  );
  return new TextDecoder().decode(plaintext);
}

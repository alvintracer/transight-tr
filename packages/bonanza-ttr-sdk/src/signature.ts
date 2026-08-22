import { getPublicKey, signDetached, verifyDetached, fromBase64 } from './crypto.js';

export interface CreateSignedHeadersOptions {
  privateKey: string;
  vaspEntityId: string;
  body?: string;
  remotePublicKey?: string;
  allianceName?: string;
  publicKey?: string;
  datetime?: string;
  nonce?: number;
}

export interface VerifySignedHeadersOptions {
  datetime: string;
  body?: string;
  nonce: string | number;
  signature: string;
  publicKey: string;
}

function nonceToBytes(nonce: number): Uint8Array {
  if (!Number.isInteger(nonce) || nonce < 0 || nonce > 0xffffffff) {
    throw new Error('Nonce must be a 32-bit unsigned integer');
  }
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, nonce, false);
  return bytes;
}

function generateNonce(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

export function buildSignatureData(datetime: string, body: string, nonce: number): Uint8Array {
  const datetimeBytes = new TextEncoder().encode(datetime);
  const bodyBytes = new TextEncoder().encode(body);
  const nonceBytes = nonceToBytes(nonce);
  const output = new Uint8Array(datetimeBytes.length + bodyBytes.length + nonceBytes.length);
  output.set(datetimeBytes, 0);
  output.set(bodyBytes, datetimeBytes.length);
  output.set(nonceBytes, datetimeBytes.length + bodyBytes.length);
  return output;
}

export async function createSignedHeaders(
  options: CreateSignedHeadersOptions
): Promise<Record<string, string>> {
  const datetime = options.datetime ?? new Date().toISOString();
  const nonce = options.nonce ?? generateNonce();
  const body = options.body ?? '';
  const publicKey = options.publicKey ?? await getPublicKey(options.privateKey);
  const signature = await signDetached(
    buildSignatureData(datetime, body, nonce),
    options.privateKey
  );
  const headers: Record<string, string> = {
    'X-Code-Req-Datetime': datetime,
    'X-Code-Req-Nonce': String(nonce),
    'X-Code-Req-PubKey': publicKey,
    'X-Code-Req-Signature': signature,
    'X-Request-Origin': `${options.allianceName ?? 'bonanza'}:${options.vaspEntityId}`,
  };
  if (options.remotePublicKey) {
    headers['X-Code-Req-Remote-PubKey'] = options.remotePublicKey;
  }
  return headers;
}

export async function verifySignedHeaders(options: VerifySignedHeadersOptions): Promise<boolean> {
  const nonce = typeof options.nonce === 'string' ? Number(options.nonce) : options.nonce;
  if (!Number.isInteger(nonce)) {
    return false;
  }
  try {
    fromBase64(options.signature);
    fromBase64(options.publicKey);
    return verifyDetached(
      buildSignatureData(options.datetime, options.body ?? '', nonce),
      options.signature,
      options.publicKey
    );
  } catch {
    return false;
  }
}

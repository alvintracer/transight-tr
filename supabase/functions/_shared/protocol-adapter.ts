/**
 * Bonanza TTR protocol adapter.
 *
 * Core direction after the 2026-08 redesign:
 * - CodeVASP-compatible Travel Rule relay is the baseline.
 * - Bonanza stores/returns counterpart public keys and relays encrypted payloads.
 * - Ed25519 registry keys are kept as the canonical public key. Encryption uses
 *   X25519 derived from the Ed25519 key in CodeVASP-compatible clients.
 * - OwnerCheck is a Bonanza extension, separated from the `/v1/code/*` namespace
 *   so existing CodeVASP compatibility is not broken.
 */

export interface AdapterTransferRequest {
  transferId: string;
  currency: string;
  amount: string;
  payload: unknown;
  originatorVaspEntityId?: string;
  beneficiaryVaspEntityId?: string;
  beneficiaryPublicKey?: string;
  callbackUrl?: string;
  adapterOptions?: Record<string, unknown>;
}

export interface AdapterTransferResponse {
  result: "verified" | "denied" | "pending";
  reasonType?: string;
  reasonMsg?: string;
  protocol?: string;
  externalReference?: string;
  responsePayload?: unknown;
}

export interface AdapterTransferResultRequest {
  transferId: string;
  transactionHash?: string;
  result?: "verified" | "denied" | "pending" | "confirmed" | "failed";
  payload?: unknown;
  originatorVaspEntityId?: string;
  beneficiaryVaspEntityId?: string;
}

export interface AdapterOwnerCheckRequest {
  ownerCheckId: string;
  currency: string;
  address: string;
  tag?: string;
  network?: string;
  payload: unknown;
  originatorVaspEntityId?: string;
  beneficiaryVaspEntityId: string;
  beneficiaryPublicKey?: string;
  callbackUrl?: string;
  policy?: Record<string, unknown>;
}

export interface AdapterOwnerCheckResponse {
  result: "verified" | "denied" | "pending";
  reasonType?: string;
  reasonMsg?: string;
  protocol?: string;
  externalReference?: string;
  responsePayload?: unknown;
}

export interface VaspTarget {
  id?: string;
  vaspEntityId?: string;
  name?: string;
  endpointUrl?: string;
  allianceName?: string;
  protocolVersion?: string;
  publicKey?: string;
  metadata?: Record<string, unknown>;
}

const DISABLED_PROTOCOLS = new Set(["gtr", "sumsub", "verifyvasp"]);

function normalizeProtocol(target: VaspTarget): string {
  const allianceName = (target.allianceName || "bonanza").toLowerCase();

  if (allianceName === "codevasp" || allianceName === "code-compatible") {
    return "code";
  }

  if (allianceName === "transight" || allianceName === "direct") {
    return "bonanza";
  }

  return allianceName;
}

function ensureCounterparty(target: VaspTarget, fallbackId?: string): string {
  const vaspEntityId = target.vaspEntityId || fallbackId;

  if (!vaspEntityId) {
    throw new Error("beneficiary VASP entity id is required");
  }

  return vaspEntityId;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function resolveBaseUrl(target: VaspTarget): string | null {
  const endpointUrl = target.endpointUrl?.trim();

  if (endpointUrl) {
    return endpointUrl;
  }

  return Deno.env.get("BONANZA_TTR_DEFAULT_ENDPOINT") || Deno.env.get("CODE_API_BASE_URL");
}

function resolveEndpoint(target: VaspTarget, path: string): string {
  const baseUrl = resolveBaseUrl(target);

  if (!baseUrl) {
    throw new Error("counterparty endpoint_url is not configured");
  }

  return joinUrl(baseUrl, path);
}

function getHubVaspEntityId(): string {
  return Deno.env.get("BONANZA_HUB_VASP_ENTITY_ID")
    || Deno.env.get("TRANSIGHT_VASP_ENTITY_ID")
    || "bonanza";
}

function getAlliancePrefix(): string {
  return Deno.env.get("BONANZA_ALLIANCE_PREFIX") || "bonanza";
}

function generateNonce(): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);

  return values[0] & 0x7fffffff;
}

function nonceToBytes(nonce: number): Uint8Array {
  const result = new Uint8Array(4);
  result[0] = (nonce >> 24) & 0xff;
  result[1] = (nonce >> 16) & 0xff;
  result[2] = (nonce >> 8) & 0xff;
  result[3] = nonce & 0xff;

  return result;
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function bytesToBase64(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value));
}

function bytesToBase64Url(value: Uint8Array): string {
  return bytesToBase64(value)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function signEd25519Base64(
  data: Uint8Array,
  privateKeyB64: string,
  publicKeyB64: string,
): Promise<string> {
  const secretKey = base64ToBytes(privateKeyB64);
  const publicKey = publicKeyB64 ? base64ToBytes(publicKeyB64) : secretKey.slice(32);

  if (secretKey.length !== 64 && secretKey.length !== 32) {
    throw new Error("Ed25519 private key must be a 32-byte seed or 64-byte secret key in Base64");
  }

  if (publicKey.length !== 32) {
    throw new Error("Ed25519 public key must be 32 bytes in Base64");
  }

  const seed = secretKey.length === 64 ? secretKey.slice(0, 32) : secretKey;
  const key = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "OKP",
      crv: "Ed25519",
      d: bytesToBase64Url(seed),
      x: bytesToBase64Url(publicKey),
      ext: true,
    },
    { name: "Ed25519" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign({ name: "Ed25519" }, key, data);

  return bytesToBase64(new Uint8Array(signature));
}

async function buildCodeHeaders(body: unknown, remotePublicKey?: string): Promise<HeadersInit> {
  const bodyText = JSON.stringify(body);
  const privateKey = Deno.env.get("CODE_API_PRIVATE_KEY") || Deno.env.get("BONANZA_SIGNING_PRIVATE_KEY");
  const publicKey = Deno.env.get("CODE_API_PUBLIC_KEY") || Deno.env.get("BONANZA_SIGNING_PUBLIC_KEY") || "";
  const origin = `${getAlliancePrefix()}:${getHubVaspEntityId()}`;
  const datetime = new Date().toISOString();
  const nonce = generateNonce();

  if (!privateKey || !publicKey) {
    throw new Error("CODE-compatible signing keys are not configured");
  }

  const signatureData = concatBytes(
    new TextEncoder().encode(datetime),
    new TextEncoder().encode(bodyText),
    nonceToBytes(nonce),
  );
  const signature = await signEd25519Base64(signatureData, privateKey, publicKey);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Code-Req-Datetime": datetime,
    "X-Code-Req-Nonce": nonce.toString(),
    "X-Code-Req-PubKey": publicKey,
    "X-Code-Req-Signature": signature,
    "X-Request-Origin": origin,
  };

  if (remotePublicKey) {
    headers["X-Code-Req-Remote-PubKey"] = remotePublicKey;
  }

  return headers;
}

async function postJson(
  url: string,
  body: unknown,
  protocol: string,
  remotePublicKey?: string,
): Promise<AdapterTransferResponse> {
  const headers = await buildCodeHeaders(body, remotePublicKey);
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let parsed: Record<string, unknown> = {};

  if (responseText) {
    try {
      parsed = JSON.parse(responseText);
    } catch (_error) {
      parsed = { raw: responseText };
    }
  }

  if (!response.ok) {
    return {
      result: "denied",
      reasonType: "COUNTERPARTY_REJECTED",
      reasonMsg: String(parsed.message || parsed.error || `HTTP ${response.status}`),
      protocol,
      responsePayload: parsed,
    };
  }

  const result = String(parsed.result || parsed.status || "pending").toLowerCase();

  return {
    result: result === "verified" || result === "confirmed"
      ? "verified"
      : result === "denied" || result === "failed"
        ? "denied"
        : "pending",
    reasonType: typeof parsed.reasonType === "string" ? parsed.reasonType : undefined,
    reasonMsg: typeof parsed.reasonMsg === "string" ? parsed.reasonMsg : undefined,
    protocol,
    externalReference: typeof parsed.transferId === "string"
      ? parsed.transferId
      : typeof parsed.ownerCheckId === "string"
        ? parsed.ownerCheckId
        : undefined,
    responsePayload: parsed,
  };
}

async function postOwnerCheckJson(
  url: string,
  body: unknown,
  protocol: string,
  remotePublicKey?: string,
): Promise<AdapterOwnerCheckResponse> {
  const response = await postJson(url, body, protocol, remotePublicKey);

  return {
    result: response.result,
    reasonType: response.reasonType,
    reasonMsg: response.reasonMsg,
    protocol: response.protocol,
    externalReference: response.externalReference,
    responsePayload: response.responsePayload,
  };
}

export async function routeTransfer(
  request: AdapterTransferRequest,
  target: VaspTarget,
): Promise<AdapterTransferResponse> {
  const protocol = normalizeProtocol(target);

  if (DISABLED_PROTOCOLS.has(protocol)) {
    return {
      result: "denied",
      reasonType: "PROTOCOL_DISABLED",
      reasonMsg: `${protocol} adapter is disabled in the Bonanza CodeVASP-core redesign`,
      protocol,
    };
  }

  const beneficiaryVaspEntityId = ensureCounterparty(target, request.beneficiaryVaspEntityId);
  const url = resolveEndpoint(target, `/v1/code/transfer/${beneficiaryVaspEntityId}`);
  const body = {
    transferId: request.transferId,
    currency: request.currency,
    amount: request.amount,
    payload: request.payload,
    originatorVaspEntityId: request.originatorVaspEntityId || getHubVaspEntityId(),
    beneficiaryVaspEntityId,
    beneficiaryPublicKey: request.beneficiaryPublicKey || target.publicKey,
    callbackUrl: request.callbackUrl,
  };

  return postJson(url, body, protocol, request.beneficiaryPublicKey || target.publicKey);
}

export async function routeTransferResult(
  request: AdapterTransferResultRequest,
  target: VaspTarget,
): Promise<AdapterTransferResponse> {
  const protocol = normalizeProtocol(target);

  if (DISABLED_PROTOCOLS.has(protocol)) {
    return {
      result: "denied",
      reasonType: "PROTOCOL_DISABLED",
      reasonMsg: `${protocol} adapter is disabled in the Bonanza CodeVASP-core redesign`,
      protocol,
    };
  }

  const counterpartyId = ensureCounterparty(
    target,
    request.beneficiaryVaspEntityId || request.originatorVaspEntityId,
  );
  const url = resolveEndpoint(target, `/v1/code/transfer-result/${counterpartyId}`);

  return postJson(url, {
    transferId: request.transferId,
    transactionHash: request.transactionHash,
    result: request.result,
    payload: request.payload,
    originatorVaspEntityId: request.originatorVaspEntityId || getHubVaspEntityId(),
    beneficiaryVaspEntityId: request.beneficiaryVaspEntityId,
  }, protocol, target.publicKey);
}

export async function routeTransferFinish(
  request: AdapterTransferResultRequest,
  target: VaspTarget,
): Promise<AdapterTransferResponse> {
  const protocol = normalizeProtocol(target);

  if (DISABLED_PROTOCOLS.has(protocol)) {
    return {
      result: "denied",
      reasonType: "PROTOCOL_DISABLED",
      reasonMsg: `${protocol} adapter is disabled in the Bonanza CodeVASP-core redesign`,
      protocol,
    };
  }

  const counterpartyId = ensureCounterparty(
    target,
    request.beneficiaryVaspEntityId || request.originatorVaspEntityId,
  );
  const url = resolveEndpoint(target, `/v1/code/transfer-finish/${counterpartyId}`);

  return postJson(url, {
    transferId: request.transferId,
    transactionHash: request.transactionHash,
    result: request.result,
    payload: request.payload,
    originatorVaspEntityId: request.originatorVaspEntityId || getHubVaspEntityId(),
    beneficiaryVaspEntityId: request.beneficiaryVaspEntityId,
  }, protocol, target.publicKey);
}

export async function routeOwnerCheck(
  request: AdapterOwnerCheckRequest,
  target: VaspTarget,
): Promise<AdapterOwnerCheckResponse> {
  const protocol = normalizeProtocol(target);

  if (DISABLED_PROTOCOLS.has(protocol)) {
    return {
      result: "denied",
      reasonType: "PROTOCOL_DISABLED",
      reasonMsg: `${protocol} adapter is disabled in the Bonanza CodeVASP-core redesign`,
      protocol,
    };
  }

  const beneficiaryVaspEntityId = ensureCounterparty(target, request.beneficiaryVaspEntityId);
  const url = resolveEndpoint(target, `/v1/owner-check/${beneficiaryVaspEntityId}`);

  return postOwnerCheckJson(url, {
    ownerCheckId: request.ownerCheckId,
    currency: request.currency,
    address: request.address,
    tag: request.tag,
    network: request.network,
    payload: request.payload,
    originatorVaspEntityId: request.originatorVaspEntityId || getHubVaspEntityId(),
    beneficiaryVaspEntityId,
    beneficiaryPublicKey: request.beneficiaryPublicKey || target.publicKey,
    callbackUrl: request.callbackUrl,
    policy: request.policy || { requireDobMatch: true },
  }, protocol, request.beneficiaryPublicKey || target.publicKey);
}

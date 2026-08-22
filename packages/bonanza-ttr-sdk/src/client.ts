import { createSignedHeaders } from './signature.js';
import type {
  BonanzaTtrClientOptions,
  FetchLike,
  HealthCheckResponse,
  OwnerCheckRequest,
  OwnerCheckResponse,
  PublicKeySearchResponse,
  ReportTransferResultRequest,
  RequestOptions,
  TransferAuthRequest,
  TransferAuthResponse,
  TransferStatusResponse,
  VaspInfo,
  VaspListResponse,
  VaspRegistrationInput,
} from './types.js';

export class BonanzaTtrError extends Error {
  readonly status: number;
  readonly response: unknown;
  readonly code?: string;

  constructor(message: string, status: number, response: unknown) {
    super(message);
    this.name = 'BonanzaTtrError';
    this.status = status;
    this.response = response;
    if (response && typeof response === 'object' && 'code' in response) {
      this.code = String((response as { code: unknown }).code);
    }
  }
}

export class BonanzaTtrClient {
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly allianceName: string;
  readonly vaspEntityId?: string;
  readonly signingPrivateKey?: string;
  readonly signingPublicKey?: string;
  readonly defaultRemotePublicKey?: string;
  private readonly fetchImpl: FetchLike;

  constructor(options: BonanzaTtrClientOptions) {
    if (!options.baseUrl) {
      throw new Error('baseUrl is required');
    }
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.apiKey = options.apiKey;
    this.allianceName = options.allianceName ?? 'bonanza';
    this.vaspEntityId = options.vaspEntityId;
    this.signingPrivateKey = options.signingPrivateKey;
    this.signingPublicKey = options.signingPublicKey;
    this.defaultRemotePublicKey = options.defaultRemotePublicKey;
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async health(): Promise<HealthCheckResponse> {
    return this.request('GET', '/health');
  }

  async listVasps(query?: Record<string, string | number | boolean | undefined>): Promise<VaspListResponse> {
    return this.request('GET', this.withQuery('/vasp-registry', query));
  }

  async getVasp(vaspEntityId: string): Promise<VaspInfo> {
    return this.request('GET', this.withQuery('/vasp-registry', { id: vaspEntityId }));
  }

  async getPublicKey(vaspEntityId: string): Promise<PublicKeySearchResponse> {
    return this.request('GET', `/vasp-registry/pubkey/${encodeURIComponent(vaspEntityId)}`);
  }

  async registerVasp(input: VaspRegistrationInput, options?: RequestOptions): Promise<VaspInfo> {
    return this.request('POST', '/vasp-registry', input, options);
  }

  async updateVasp(input: Partial<VaspRegistrationInput>, options?: RequestOptions): Promise<VaspInfo> {
    return this.request('PUT', '/vasp-registry', input, options);
  }

  async rotateKey(input: Record<string, unknown>, options?: RequestOptions): Promise<unknown> {
    return this.request('POST', '/vasp-registry/rotate-key', input, options);
  }

  async createTransfer(
    input: TransferAuthRequest,
    options?: RequestOptions
  ): Promise<TransferAuthResponse> {
    return this.request('POST', '/transfer-auth', input, options);
  }

  async receiveTransfer(
    input: TransferAuthRequest,
    options?: RequestOptions
  ): Promise<TransferAuthResponse> {
    return this.request('POST', '/transfer-auth/incoming', input, options);
  }

  async getTransfer(transferId: string): Promise<TransferStatusResponse> {
    return this.request('GET', this.withQuery('/transfer-auth', { id: transferId }));
  }

  async reportTransferResult(
    input: ReportTransferResultRequest,
    options?: RequestOptions
  ): Promise<unknown> {
    return this.request('POST', '/transfer-auth/result', input, options);
  }

  async finishTransfer(input: Record<string, unknown>, options?: RequestOptions): Promise<unknown> {
    return this.request('POST', '/transfer-auth/finish', input, options);
  }

  async createOwnerCheck(
    input: OwnerCheckRequest,
    options?: RequestOptions & { beneficiaryVaspEntityId?: string }
  ): Promise<OwnerCheckResponse> {
    const target = options?.beneficiaryVaspEntityId;
    const path = target
      ? `/owner-check/${encodeURIComponent(target)}`
      : '/owner-check';
    return this.request('POST', path, input, options);
  }

  async getOwnerCheck(ownerCheckId: string): Promise<OwnerCheckResponse> {
    return this.request('GET', this.withQuery('/owner-check', { id: ownerCheckId }));
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const bodyText = body === undefined ? undefined : JSON.stringify(body);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...options?.headers,
    };
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }
    if (bodyText !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    const shouldSign = options?.sign ?? Boolean(this.signingPrivateKey && this.vaspEntityId);
    if (shouldSign) {
      if (!this.signingPrivateKey || !this.vaspEntityId) {
        throw new Error('signingPrivateKey and vaspEntityId are required for signed requests');
      }
      Object.assign(headers, await createSignedHeaders({
        privateKey: this.signingPrivateKey,
        publicKey: this.signingPublicKey,
        vaspEntityId: this.vaspEntityId,
        allianceName: this.allianceName,
        remotePublicKey: options?.remotePublicKey ?? this.defaultRemotePublicKey,
        body: bodyText ?? '',
      }));
    }
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: bodyText,
    });
    const parsed = await this.parseResponse(response);
    if (!response.ok) {
      const message = this.errorMessage(parsed, response.status);
      throw new BonanzaTtrError(message, response.status, parsed);
    }
    return parsed as T;
  }

  private withQuery(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    if (!query) {
      return path;
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params.set(key, String(value));
      }
    }
    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  }

  private async parseResponse(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private errorMessage(response: unknown, status: number): string {
    if (response && typeof response === 'object') {
      const record = response as Record<string, unknown>;
      if (typeof record.error === 'string') {
        return record.error;
      }
      if (typeof record.message === 'string') {
        return record.message;
      }
      if (typeof record.reasonMsg === 'string') {
        return record.reasonMsg;
      }
    }
    return `TravelSafer request failed with HTTP ${status}`;
  }
}

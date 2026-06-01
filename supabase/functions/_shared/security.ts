/**
 * 보안 미들웨어 — 요청 검증 + 레이트 리밋 + 입력 정제
 * 
 * 모든 Edge Function에서 공유하는 보안 레이어
 */

// ============================================================
// Request Validation
// ============================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * 필수 필드 검증
 */
export function validateRequired(
  body: Record<string, unknown>,
  requiredFields: string[],
): ValidationResult {
  const missing = requiredFields.filter(f => body[f] === undefined || body[f] === null || body[f] === '');
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(', ')}`,
      statusCode: 400,
    };
  }
  return { valid: true };
}

/**
 * transferId 포맷 검증 (UUID v4 또는 합리적 ID)
 */
export function validateTransferId(transferId: string): ValidationResult {
  if (!transferId || transferId.length < 1 || transferId.length > 128) {
    return { valid: false, error: 'transferId must be 1-128 characters', statusCode: 400 };
  }
  // 특수문자 제한 (injection 방지)
  if (!/^[a-zA-Z0-9\-_.:]+$/.test(transferId)) {
    return { valid: false, error: 'transferId contains invalid characters', statusCode: 400 };
  }
  return { valid: true };
}

/**
 * 금액 검증
 */
export function validateAmount(amount: string): ValidationResult {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: 'amount must be a positive number', statusCode: 400 };
  }
  if (amount.length > 32) {
    return { valid: false, error: 'amount too long', statusCode: 400 };
  }
  return { valid: true };
}

/**
 * 통화 코드 검증
 */
export function validateCurrency(currency: string): ValidationResult {
  if (!currency || currency.length < 2 || currency.length > 10) {
    return { valid: false, error: 'Invalid currency code', statusCode: 400 };
  }
  if (!/^[A-Za-z0-9]+$/.test(currency)) {
    return { valid: false, error: 'Currency contains invalid characters', statusCode: 400 };
  }
  return { valid: true };
}

/**
 * VASP Entity ID 검증
 */
export function validateVaspEntityId(id: string): ValidationResult {
  if (!id || id.length > 128) {
    return { valid: false, error: 'vaspEntityId must be 1-128 characters', statusCode: 400 };
  }
  if (!/^[a-zA-Z0-9\-_.]+$/.test(id)) {
    return { valid: false, error: 'vaspEntityId contains invalid characters', statusCode: 400 };
  }
  return { valid: true };
}

// ============================================================
// Input Sanitization
// ============================================================

/**
 * 문자열 정제 (XSS, SQL injection 방지)
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '')       // HTML 태그 제거
    .replace(/['";\\]/g, '')    // SQL injection 문자 제거
    .trim()
    .slice(0, 1024);            // 최대 길이 제한
}

/**
 * 요청 본문 정제
 */
export function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (value === null || value === undefined) {
      sanitized[key] = value;
    } else {
      sanitized[key] = value; // 객체/배열은 그대로
    }
  }
  return sanitized;
}

// ============================================================
// Rate Limiting (메모리 기반 — Edge Function 인스턴스별)
// ============================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitConfig {
  windowMs: number;     // 윈도우 크기 (ms)
  maxRequests: number;  // 윈도우당 최대 요청 수
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,    // 1분
  maxRequests: 60,     // 분당 60회
};

/**
 * 레이트 리밋 체크
 * @param clientId 클라이언트 식별자 (IP, API Key 등)
 * @param config 레이트 리밋 설정
 * @returns true면 허용, false면 제한
 */
export function checkRateLimit(
  clientId: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT,
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(clientId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + config.windowMs });
    return true;
  }

  if (entry.count >= config.maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * 요청에서 클라이언트 ID 추출
 */
export function getClientId(req: Request): string {
  return req.headers.get('x-forwarded-for')
    ?? req.headers.get('x-real-ip')
    ?? req.headers.get('x-code-req-pubkey')
    ?? 'unknown';
}

// ============================================================
// Request Timestamp Validation
// ============================================================

/**
 * 요청 타임스탬프 유효성 검증 (리플레이 공격 방지)
 * @param datetime ISO8601 datetime 문자열
 * @param maxAgeMs 최대 허용 시간차 (기본 5분)
 */
export function validateTimestamp(datetime: string, maxAgeMs = 300_000): ValidationResult {
  const requestTime = new Date(datetime).getTime();
  if (isNaN(requestTime)) {
    return { valid: false, error: 'Invalid datetime format', statusCode: 400 };
  }

  const diff = Math.abs(Date.now() - requestTime);
  if (diff > maxAgeMs) {
    return { valid: false, error: `Request timestamp too old (${Math.round(diff / 1000)}s)`, statusCode: 401 };
  }

  return { valid: true };
}

// ============================================================
// Content-Type Validation
// ============================================================

/**
 * Content-Type 검증
 */
export function validateContentType(req: Request): ValidationResult {
  if (req.method === 'GET' || req.method === 'OPTIONS' || req.method === 'DELETE') {
    return { valid: true };
  }

  const ct = req.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    return { valid: false, error: 'Content-Type must be application/json', statusCode: 415 };
  }

  return { valid: true };
}

// ============================================================
// Payload Size Validation
// ============================================================

/**
 * 요청 본문 크기 제한 (기본 1MB)
 */
export function validatePayloadSize(body: string, maxBytes = 1_048_576): ValidationResult {
  const size = new TextEncoder().encode(body).length;
  if (size > maxBytes) {
    return {
      valid: false,
      error: `Payload too large: ${size} bytes (max ${maxBytes})`,
      statusCode: 413,
    };
  }
  return { valid: true };
}

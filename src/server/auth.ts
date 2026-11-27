import crypto from 'node:crypto';

const fallbackSecret = crypto.randomBytes(32).toString('hex');

function getSessionSecret(): string {
  const envSecret = process.env.SESSION_SECRET?.trim();
  return envSecret && envSecret.length >= 16 ? envSecret : fallbackSecret;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }
  const [, salt, originalHex] = parts;
  if (!salt || !originalHex) {
    return false;
  }
  const originalBuf = Buffer.from(originalHex, 'hex');
  const candidateBuf = crypto.scryptSync(password, salt, 64);
  if (originalBuf.length !== candidateBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(originalBuf, candidateBuf);
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export interface SessionPayload {
  email: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

export function createSessionToken(email: string, tokenVersion: number, ttlSeconds: number = 60 * 60 * 12): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    email: email.trim().toLowerCase(),
    tokenVersion,
    iat: now,
    exp: now + ttlSeconds,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifySessionToken(
  token: string,
  expectedEmail: string,
  expectedTokenVersion: number
): SessionPayload | null {
  if (!token || typeof token !== 'string') {
    return null;
  }
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) {
    return null;
  }
  const payloadB64 = token.slice(0, dotIdx);
  const sigB64 = token.slice(dotIdx + 1);
  if (!payloadB64 || !sigB64) {
    return null;
  }

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(payloadB64)
    .digest('base64url');

  if (!timingSafeEqualString(sigB64, expectedSig)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!parsed || typeof parsed.email !== 'string' || typeof parsed.exp !== 'number') {
      return null;
    }
    if (parsed.exp <= now) {
      return null;
    }
    if (parsed.email.toLowerCase() !== expectedEmail.trim().toLowerCase()) {
      return null;
    }
    if (parsed.tokenVersion !== expectedTokenVersion) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getEnvAdminConfig(): { email: string; password: string } | null {
  const email = process.env.ADMIN_EMAIL?.trim() ?? '';
  const password = process.env.ADMIN_PASSWORD ?? '';
  if (email.length > 0 && password.length > 0) {
    return { email: email.toLowerCase(), password };
  }
  return null;
}

// Remote Access Authentication Module
// Handles API key generation, storage, and request validation

import { randomBytes } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { settingsManager } from './settings.js';

// Short-lived session tokens for WebView proxy sub-resource loading.
// When a proxied HTML page is served, a session token is minted and set as a
// cookie. The browser then automatically includes it in script/CSS/image fetches,
// which cannot carry HMAC headers.
interface ProxySession {
  port: number;
  expiresAt: number;
}
const proxySessionStore = new Map<string, ProxySession>();

export function createProxySession(port: number): string {
  const token = randomBytes(32).toString('hex');
  proxySessionStore.set(token, { port, expiresAt: Date.now() + 60 * 60 * 1000 });
  // Opportunistic cleanup of expired sessions
  for (const [key, val] of proxySessionStore) {
    if (val.expiresAt < Date.now()) proxySessionStore.delete(key);
  }
  return token;
}

export function validateProxySessionToken(token: string): boolean {
  const session = proxySessionStore.get(token);
  if (!session) return false;
  if (session.expiresAt < Date.now()) {
    proxySessionStore.delete(token);
    return false;
  }
  return true;
}

// CORS configuration for mobile app access
const DEFAULT_ALLOWED_ORIGINS: string[] = [];

// API Key validation middleware
export function validateApiKey(req: Request, res: Response, next: NextFunction): void {
  // Allow requests carrying a valid proxy session cookie — these are browser-initiated
  // sub-resource requests (CSS, JS, images) from a proxied page and cannot carry API key headers.
  const cookieHeader = (req.headers['cookie'] as string) || '';
  const cookieMap = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim().split('='))
      .filter((p) => p.length === 2)
      .map(([k, v]) => [k.trim(), v.trim()]),
  );
  const sessionToken = cookieMap['omni-proxy-session'];
  if (sessionToken && validateProxySessionToken(sessionToken)) {
    next();
    return;
  }

  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    res.status(401).json({ error: 'Missing API key. Include X-API-Key header.' });
    return;
  }

  const storedKey = settingsManager.get('remoteAccess.apiKey') as string | null;

  if (!storedKey) {
    res.status(500).json({ error: 'Server not properly configured. API key not set.' });
    return;
  }

  // Use timing-safe comparison to prevent timing attacks
  if (!timingSafeEqual(apiKey, storedKey)) {
    res.status(401).json({ error: 'Invalid API key.' });
    return;
  }

  next();
}

// Generate a new random API key
export function generateApiKey(): string {
  // Generate 32 random bytes and encode as hex
  return randomBytes(32).toString('hex');
}

// Ensure API key exists, generating one if needed
export function ensureApiKey(): string {
  let apiKey = settingsManager.get('remoteAccess.apiKey') as string | null;

  if (!apiKey) {
    apiKey = generateApiKey();
    settingsManager.set('remoteAccess.apiKey', apiKey);
    console.log('[RemoteAuth] Generated new API key for remote access');
  }

  return apiKey;
}

// Get current API key (if any)
export function getApiKey(): string | null {
  return settingsManager.get('remoteAccess.apiKey') as string | null;
}

// Regenerate API key (invalidates old one)
export function regenerateApiKey(): string {
  const newKey = generateApiKey();
  settingsManager.set('remoteAccess.apiKey', newKey);
  console.log('[RemoteAuth] Regenerated API key for remote access');
  return newKey;
}

// CORS middleware configuration
export function getCorsOptions(): {
  origin: string[] | boolean;
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
} {
  const allowedOrigins = settingsManager.get('remoteAccess.allowedOrigins') as string[] | undefined;

  // If no origins specified, allow all (for development - should be restricted in production)
  const origin: string[] | boolean =
    allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true;

  return {
    origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
    credentials: true,
  };
}

// IP Allowlist middleware (optional extra security)
export function validateIp(req: Request, res: Response, next: NextFunction): void {
  // For now, we skip IP validation as ngrok IPs change
  // This could be extended to support IP allowlists in the future
  next();
}

/**
 * HMAC request signature middleware.
 * Clients must send:
 *   X-Timestamp: <Unix ms timestamp>
 *   X-Signature: HMAC-SHA256(apiKey, "METHOD\nPATH_WITH_QUERY\nTIMESTAMP") as hex
 *
 * Requests with a timestamp older than 5 minutes are rejected, preventing replays.
 */
export function validateRequestSignature(req: Request, res: Response, next: NextFunction): void {
  // Allow requests that carry a valid proxy session cookie.
  // These are browser-initiated sub-resource fetches (JS, CSS, images) from a
  // proxied HTML page — they cannot include HMAC headers.
  const cookieHeader = (req.headers['cookie'] as string) || '';
  const cookieMap = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim().split('='))
      .filter((p) => p.length === 2)
      .map(([k, v]) => [k.trim(), v.trim()]),
  );
  const sessionToken = cookieMap['omni-proxy-session'];
  if (sessionToken && validateProxySessionToken(sessionToken)) {
    next();
    return;
  }

  const timestamp = req.headers['x-timestamp'] as string | undefined;
  const signature = req.headers['x-signature'] as string | undefined;

  if (!timestamp || !signature) {
    res.status(401).json({ error: 'Missing X-Timestamp or X-Signature headers.' });
    return;
  }

  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
    res.status(401).json({ error: 'Request timestamp is expired or invalid.' });
    return;
  }

  const apiKey = settingsManager.get('remoteAccess.apiKey') as string | null;
  if (!apiKey) {
    res.status(500).json({ error: 'Server not properly configured.' });
    return;
  }

  const signingString = `${req.method}\n${req.originalUrl}\n${timestamp}`;
  const expected = crypto.createHmac('sha256', apiKey).update(signingString).digest('hex');

  if (!timingSafeEqual(signature, expected)) {
    res.status(401).json({ error: 'Invalid request signature.' });
    return;
  }

  next();
}

// Timing-safe string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do the comparison to prevent leaking length info
    // But always return false for different lengths
    const bufA = Buffer.from(a);
    const bufB = Buffer.alloc(bufA.length, 0);
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    crypto.timingSafeEqual(bufA, bufB);
    return false;
  }

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}

// Import crypto for timingSafeEqual
import * as crypto from 'node:crypto';

// Remote Access Authentication Module
// Handles API key generation, storage, and request validation

import { randomBytes } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { settingsManager } from './settings.js';

// CORS configuration for mobile app access
const DEFAULT_ALLOWED_ORIGINS: string[] = [];

// API Key validation middleware
export function validateApiKey(req: Request, res: Response, next: NextFunction): void {
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

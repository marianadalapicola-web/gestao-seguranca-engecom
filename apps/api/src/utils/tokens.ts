import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '../config/permissions';

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpiresIn as any });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
}

/**
 * Refresh tokens and password-reset tokens are random opaque strings.
 * Only their SHA-256 hash is persisted, so a leaked database dump does not
 * expose usable tokens (mirrors how passwords are hashed with bcrypt, but
 * these are high-entropy random values so a fast hash is sufficient).
 */
export function generateOpaqueToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashOpaqueToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * unitMs[unit];
}

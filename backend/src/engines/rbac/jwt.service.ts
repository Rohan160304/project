import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import { RoleKey } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string; // userId
  publicId: string | null;
  role: RoleKey;
  isSuperAdmin: boolean;
  deviceId?: string;
}

export interface RefreshTokenPayload {
  sub: string;
  deviceId: string;
  tokenVersion: string; // random per-issue value, checked against stored hash
}

export interface RegistrationTokenPayload {
  mobile: string;
  verified: boolean;
  purpose: 'REGISTER';
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  } as SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

export function signRegistrationToken(payload: RegistrationTokenPayload): string {
  // Use ACCESS_SECRET or a dedicated secret. We'll use ACCESS_SECRET for simplicity, valid for 1 hour.
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: '1h',
  } as SignOptions);
}

export function verifyRegistrationToken(token: string): RegistrationTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as RegistrationTokenPayload;
}

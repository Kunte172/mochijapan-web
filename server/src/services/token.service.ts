import { createHash } from 'node:crypto';

import jwt, { type JwtPayload } from 'jsonwebtoken';

import type { UserRole } from '../generated/prisma/client.js';
import { AppError } from '../utils/app-error.js';

export const ACCESS_TOKEN_SECONDS = 15 * 60;
export const REFRESH_TOKEN_SECONDS = 7 * 24 * 60 * 60;

function getSecret(name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET') {
  const secret = process.env[name];

  if (!secret) {
    throw new Error(`${name} is not configured`);
  }

  return secret;
}

type MochiTokenPayload = JwtPayload & {
  type: 'access' | 'refresh';
  sid: string;
  role?: UserRole;
  sub: string;
};

export function signAccessToken(
  userId: string,
  role: UserRole,
  sessionId: string,
) {
  return jwt.sign(
    {
      type: 'access',
      role,
      sid: sessionId,
    },
    getSecret('JWT_ACCESS_SECRET'),
    {
      subject: userId,
      expiresIn: ACCESS_TOKEN_SECONDS,
    },
  );
}

export function signRefreshToken(userId: string, sessionId: string) {
  return jwt.sign(
    {
      type: 'refresh',
      sid: sessionId,
    },
    getSecret('JWT_REFRESH_SECRET'),
    {
      subject: userId,
      expiresIn: REFRESH_TOKEN_SECONDS,
    },
  );
}

function parseVerifiedToken(value: string | JwtPayload): MochiTokenPayload {
  if (
    typeof value === 'string' ||
    !value.sub ||
    typeof value.sid !== 'string' ||
    (value.type !== 'access' && value.type !== 'refresh')
  ) {
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid authentication token.');
  }

  return value as MochiTokenPayload;
}

export function verifyAccessToken(token: string) {
  try {
    const payload = parseVerifiedToken(
      jwt.verify(token, getSecret('JWT_ACCESS_SECRET')),
    );

    if (payload.type !== 'access' || !payload.role) {
      throw new AppError(401, 'INVALID_ACCESS_TOKEN', 'Invalid access token.');
    }

    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(401, 'INVALID_ACCESS_TOKEN', 'Invalid or expired access token.');
  }
}

export function verifyRefreshToken(token: string) {
  try {
    const payload = parseVerifiedToken(
      jwt.verify(token, getSecret('JWT_REFRESH_SECRET')),
    );

    if (payload.type !== 'refresh') {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token.');
    }

    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token.');
  }
}

export function hashRefreshToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

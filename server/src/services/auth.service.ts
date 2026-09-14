import { randomUUID } from 'node:crypto';

import { prisma } from '../lib/prisma.js';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema.js';
import { AppError } from '../utils/app-error.js';
import { hashPassword, verifyPassword } from './password.service.js';
import {
  REFRESH_TOKEN_SECONDS,
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './token.service.js';

type SessionMetadata = {
  userAgent?: string;
  ipAddress?: string;
};

function safeUser(user: {
  id: string;
  email: string;
  displayName: string | null;
  role: 'STUDENT' | 'ADMIN';
  emailVerifiedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    emailVerified: Boolean(user.emailVerifiedAt),
    createdAt: user.createdAt,
  };
}

async function createSession(
  user: {
    id: string;
    role: 'STUDENT' | 'ADMIN';
  },
  metadata: SessionMetadata,
) {
  const sessionId = randomUUID();
  const refreshToken = signRefreshToken(user.id, sessionId);

  await prisma.authSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_SECONDS * 1000),
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    },
  });

  return {
    accessToken: signAccessToken(user.id, user.role, sessionId),
    refreshToken,
  };
}

export async function registerUser(
  input: RegisterInput,
  metadata: SessionMetadata,
) {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'Email is already registered.');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: input.displayName?.trim() || null,
    },
  });

  const tokens = await createSession(user, metadata);

  return {
    user: safeUser(user),
    ...tokens,
  };
}

export async function loginUser(input: LoginInput, metadata: SessionMetadata) {
  const email = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }

  if (!user.isActive) {
    throw new AppError(403, 'ACCOUNT_DISABLED', 'This account is disabled.');
  }

  const tokens = await createSession(user, metadata);

  return {
    user: safeUser(user),
    ...tokens,
  };
}

export async function refreshAuthSession(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashRefreshToken(refreshToken);

  const session = await prisma.authSession.findUnique({
    where: { id: payload.sid },
    include: { user: true },
  });

  if (
    !session ||
    session.userId !== payload.sub ||
    session.refreshTokenHash !== tokenHash ||
    session.revokedAt ||
    session.expiresAt <= new Date()
  ) {
    throw new AppError(401, 'INVALID_SESSION', 'Refresh session is invalid or expired.');
  }

  if (!session.user.isActive) {
    throw new AppError(403, 'ACCOUNT_DISABLED', 'This account is disabled.');
  }

  const nextRefreshToken = signRefreshToken(session.userId, session.id);

  await prisma.authSession.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: hashRefreshToken(nextRefreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_SECONDS * 1000),
    },
  });

  return {
    accessToken: signAccessToken(session.userId, session.user.role, session.id),
    refreshToken: nextRefreshToken,
  };
}

export async function logoutAuthSession(refreshToken?: string) {
  if (!refreshToken) {
    return;
  }

  const tokenHash = hashRefreshToken(refreshToken);

  await prisma.authSession.updateMany({
    where: {
      refreshTokenHash: tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.isActive) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User was not found.');
  }

  return safeUser(user);
}

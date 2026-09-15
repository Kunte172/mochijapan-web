import { randomUUID } from 'node:crypto';

import { AccountTokenType } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '../schemas/auth.schema.js';
import { AppError } from '../utils/app-error.js';
import {
  createAccountActionToken,
  EMAIL_VERIFICATION_SECONDS,
  hashAccountToken,
  PASSWORD_RESET_SECONDS,
} from './account-token.service.js';
import { sendPasswordResetEmail, sendVerificationEmail } from './mail.service.js';
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

async function revokeAllSessions(userId: string, at = new Date()) {
  await prisma.authSession.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: at,
    },
  });
}

export async function registerUser(input: RegisterInput, metadata: SessionMetadata) {
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

  const [tokens, verificationToken] = await Promise.all([
    createSession(user, metadata),
    createAccountActionToken(
      user.id,
      AccountTokenType.EMAIL_VERIFICATION,
      EMAIL_VERIFICATION_SECONDS,
    ),
  ]);

  await sendVerificationEmail(user.email, verificationToken);

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

export async function verifyEmailAddress(rawToken: string) {
  const tokenHash = hashAccountToken(rawToken);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const token = await tx.accountActionToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !token ||
      token.type !== AccountTokenType.EMAIL_VERIFICATION ||
      token.usedAt ||
      token.expiresAt <= now ||
      !token.user.isActive
    ) {
      throw new AppError(400, 'TOKEN_INVALID_OR_EXPIRED', 'Verification token is invalid or expired.');
    }

    const user = token.user.emailVerifiedAt
      ? token.user
      : await tx.user.update({
          where: { id: token.userId },
          data: { emailVerifiedAt: now },
        });

    await tx.accountActionToken.update({
      where: { id: token.id },
      data: { usedAt: now },
    });

    await tx.accountActionToken.updateMany({
      where: {
        userId: token.userId,
        type: AccountTokenType.EMAIL_VERIFICATION,
        usedAt: null,
      },
      data: { usedAt: now },
    });

    return safeUser(user);
  });
}

export async function resendEmailVerification(inputEmail: string) {
  const email = inputEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive || user.emailVerifiedAt) {
    return;
  }

  const token = await createAccountActionToken(
    user.id,
    AccountTokenType.EMAIL_VERIFICATION,
    EMAIL_VERIFICATION_SECONDS,
  );

  await sendVerificationEmail(user.email, token);
}

export async function requestPasswordReset(inputEmail: string) {
  const email = inputEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    return;
  }

  const token = await createAccountActionToken(
    user.id,
    AccountTokenType.PASSWORD_RESET,
    PASSWORD_RESET_SECONDS,
  );

  await sendPasswordResetEmail(user.email, token);
}

export async function resetPassword(input: ResetPasswordInput) {
  const tokenHash = hashAccountToken(input.token);
  const token = await prisma.accountActionToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  const now = new Date();

  if (
    !token ||
    token.type !== AccountTokenType.PASSWORD_RESET ||
    token.usedAt ||
    token.expiresAt <= now ||
    !token.user.isActive
  ) {
    throw new AppError(400, 'TOKEN_INVALID_OR_EXPIRED', 'Password reset token is invalid or expired.');
  }

  if (await verifyPassword(input.newPassword, token.user.passwordHash)) {
    throw new AppError(400, 'PASSWORD_REUSE', 'New password must be different from the current password.');
  }

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.$transaction(async (tx) => {
    const claim = await tx.accountActionToken.updateMany({
      where: {
        id: token.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });

    if (claim.count !== 1) {
      throw new AppError(400, 'TOKEN_INVALID_OR_EXPIRED', 'Password reset token is invalid or expired.');
    }

    await tx.user.update({
      where: { id: token.userId },
      data: {
        passwordHash,
        passwordChangedAt: now,
      },
    });

    await tx.authSession.updateMany({
      where: {
        userId: token.userId,
        revokedAt: null,
      },
      data: { revokedAt: now },
    });

    await tx.accountActionToken.updateMany({
      where: {
        userId: token.userId,
        type: AccountTokenType.PASSWORD_RESET,
        usedAt: null,
      },
      data: { usedAt: now },
    });
  });
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.isActive) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User was not found.');
  }

  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw new AppError(400, 'INVALID_CURRENT_PASSWORD', 'Current password is incorrect.');
  }

  if (await verifyPassword(input.newPassword, user.passwordHash)) {
    throw new AppError(400, 'PASSWORD_REUSE', 'New password must be different from the current password.');
  }

  const passwordHash = await hashPassword(input.newPassword);
  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: now,
      },
    }),
    prisma.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: now },
    }),
    prisma.accountActionToken.updateMany({
      where: {
        userId,
        type: AccountTokenType.PASSWORD_RESET,
        usedAt: null,
      },
      data: { usedAt: now },
    }),
  ]);
}

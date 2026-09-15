import { createHash, randomBytes } from 'node:crypto';

import type { AccountTokenType } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

export const EMAIL_VERIFICATION_SECONDS = 24 * 60 * 60;
export const PASSWORD_RESET_SECONDS = 30 * 60;

export function hashAccountToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function newOpaqueToken() {
  return randomBytes(32).toString('hex');
}

export async function createAccountActionToken(
  userId: string,
  type: AccountTokenType,
  ttlSeconds: number,
) {
  const rawToken = newOpaqueToken();
  const tokenHash = hashAccountToken(rawToken);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await prisma.$transaction([
    prisma.accountActionToken.deleteMany({
      where: {
        userId,
        type,
        usedAt: null,
      },
    }),
    prisma.accountActionToken.create({
      data: {
        userId,
        type,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  return rawToken;
}

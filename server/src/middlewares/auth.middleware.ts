import type { NextFunction, Request, Response } from 'express';

import { prisma } from '../lib/prisma.js';
import { verifyAccessToken } from '../services/token.service.js';
import { AppError } from '../utils/app-error.js';

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authorization = req.get('authorization');

    if (!authorization?.startsWith('Bearer ')) {
      throw new AppError(401, 'AUTH_REQUIRED', 'Authentication is required.');
    }

    const token = authorization.slice('Bearer '.length).trim();
    const payload = verifyAccessToken(token);

    const session = await prisma.authSession.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !session.user.isActive
    ) {
      throw new AppError(401, 'INVALID_SESSION', 'Authentication session is invalid or revoked.');
    }

    req.auth = {
      userId: payload.sub,
      role: session.user.role,
      sessionId: session.id,
    };

    next();
  } catch (error) {
    next(error);
  }
}

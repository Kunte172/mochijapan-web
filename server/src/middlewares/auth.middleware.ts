import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/app-error.js';
import { verifyAccessToken } from '../services/token.service.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authorization = req.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return next(new AppError(401, 'AUTH_REQUIRED', 'Authentication is required.'));
  }

  const token = authorization.slice('Bearer '.length).trim();
  const payload = verifyAccessToken(token);

  req.auth = {
    userId: payload.sub,
    role: payload.role!,
    sessionId: payload.sid,
  };

  next();
}

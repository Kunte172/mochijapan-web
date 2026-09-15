import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/app-error.js';

export function requireTrustedOrigin(req: Request, _res: Response, next: NextFunction) {
  const origin = req.get('origin');

  // CLI/API tools such as PowerShell or curl may not send Origin.
  if (!origin) {
    return next();
  }

  const expectedOrigin = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

  if (origin !== expectedOrigin) {
    return next(new AppError(403, 'UNTRUSTED_ORIGIN', 'Request origin is not allowed.'));
  }

  next();
}

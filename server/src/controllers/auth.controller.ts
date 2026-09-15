import type { CookieOptions, Request, Response } from 'express';

import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../schemas/auth.schema.js';
import {
  changePassword,
  getCurrentUser,
  loginUser,
  logoutAuthSession,
  refreshAuthSession,
  registerUser,
  requestPasswordReset,
  resendEmailVerification,
  resetPassword,
  verifyEmailAddress,
} from '../services/auth.service.js';
import { REFRESH_TOKEN_SECONDS } from '../services/token.service.js';
import { AppError } from '../utils/app-error.js';

const REFRESH_COOKIE_NAME = 'mochijapan_refresh';

function refreshCookieOptions(): CookieOptions {
  const production = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_SECONDS * 1000,
  };
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...refreshCookieOptions(),
    maxAge: undefined,
  });
}

function sessionMetadata(req: Request) {
  return {
    userAgent: req.get('user-agent'),
    ipAddress: req.ip,
  };
}

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const result = await registerUser(input, sessionMetadata(req));

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());

  return res.status(201).json({
    status: 'ok',
    user: result.user,
    accessToken: result.accessToken,
  });
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input, sessionMetadata(req));

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());

  return res.status(200).json({
    status: 'ok',
    user: result.user,
    accessToken: result.accessToken,
  });
}

export async function refresh(req: Request, res: Response) {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (!refreshToken) {
    throw new AppError(401, 'REFRESH_TOKEN_REQUIRED', 'Refresh token is required.');
  }

  const result = await refreshAuthSession(refreshToken);

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());

  return res.status(200).json({
    status: 'ok',
    accessToken: result.accessToken,
  });
}

export async function logout(req: Request, res: Response) {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  await logoutAuthSession(refreshToken);
  clearRefreshCookie(res);

  return res.status(204).send();
}

export async function me(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, 'AUTH_REQUIRED', 'Authentication is required.');
  }

  const user = await getCurrentUser(req.auth.userId);

  return res.status(200).json({
    status: 'ok',
    user,
  });
}

export async function verifyEmail(req: Request, res: Response) {
  const { token } = verifyEmailSchema.parse(req.body);
  const user = await verifyEmailAddress(token);

  return res.status(200).json({
    status: 'ok',
    user,
  });
}

export async function resendVerification(req: Request, res: Response) {
  const { email } = resendVerificationSchema.parse(req.body);
  await resendEmailVerification(email);

  return res.status(202).json({
    status: 'ok',
    message: 'If the account exists and is not verified, a verification message has been prepared.',
  });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = forgotPasswordSchema.parse(req.body);
  await requestPasswordReset(email);

  return res.status(202).json({
    status: 'ok',
    message: 'If the account exists, password reset instructions have been prepared.',
  });
}

export async function resetPasswordController(req: Request, res: Response) {
  const input = resetPasswordSchema.parse(req.body);
  await resetPassword(input);
  clearRefreshCookie(res);

  return res.status(204).send();
}

export async function changePasswordController(req: Request, res: Response) {
  if (!req.auth) {
    throw new AppError(401, 'AUTH_REQUIRED', 'Authentication is required.');
  }

  const input = changePasswordSchema.parse(req.body);
  await changePassword(req.auth.userId, input);
  clearRefreshCookie(res);

  return res.status(204).send();
}

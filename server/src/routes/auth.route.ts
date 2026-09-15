import { Router } from 'express';

import {
  changePasswordController,
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resendVerification,
  resetPasswordController,
  verifyEmail,
} from '../controllers/auth.controller.js';
import {
  accountRecoveryLimiter,
  authWriteLimiter,
  loginLimiter,
} from '../middlewares/auth-rate-limit.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireTrustedOrigin } from '../middlewares/trusted-origin.middleware.js';

export const authRouter = Router();

authRouter.post('/register', requireTrustedOrigin, authWriteLimiter, register);
authRouter.post('/login', requireTrustedOrigin, loginLimiter, login);
authRouter.post('/refresh', requireTrustedOrigin, authWriteLimiter, refresh);
authRouter.post('/logout', requireTrustedOrigin, authWriteLimiter, logout);
authRouter.get('/me', requireAuth, me);

authRouter.post('/verify-email', requireTrustedOrigin, accountRecoveryLimiter, verifyEmail);
authRouter.post('/resend-verification', requireTrustedOrigin, accountRecoveryLimiter, resendVerification);
authRouter.post('/forgot-password', requireTrustedOrigin, accountRecoveryLimiter, forgotPassword);
authRouter.post('/reset-password', requireTrustedOrigin, accountRecoveryLimiter, resetPasswordController);
authRouter.post('/change-password', requireTrustedOrigin, authWriteLimiter, requireAuth, changePasswordController);

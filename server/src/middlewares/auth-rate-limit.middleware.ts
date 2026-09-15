import rateLimit from 'express-rate-limit';

function errorPayload(message: string) {
  return {
    status: 'error',
    code: 'RATE_LIMITED',
    message,
  };
}

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(errorPayload('Too many login attempts. Please try again later.'));
  },
});

export const accountRecoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(errorPayload('Too many account recovery requests. Please try again later.'));
  },
});

export const authWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(errorPayload('Too many authentication requests. Please try again later.'));
  },
});

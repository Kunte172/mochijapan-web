import type { NextFunction, Request, Response } from 'express';
import { analyticsQuerySchema } from '../schemas/analytics.schema.js';
import { getLearningAnalytics } from '../services/analytics.service.js';

function userIdFrom(req: Request) {
  if (!req.auth?.userId) throw new Error('Authenticated user is missing from request.');
  return req.auth.userId;
}

export async function getMyLearningAnalytics(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = analyticsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_ANALYTICS_QUERY',
        message: 'Analytics query is invalid.',
      });
      return;
    }
    const data = await getLearningAnalytics(userIdFrom(req), parsed.data.days);
    res.status(200).json({ status: 'ok', data });
  } catch (error) {
    next(error);
  }
}

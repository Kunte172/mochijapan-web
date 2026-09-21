import type {
  NextFunction,
  Request,
  Response,
} from 'express';
import { startReviewSessionSchema } from '../schemas/review-queue.schema.js';
import {
  getActiveReviewSession,
  getReviewSummary,
  startReviewSession,
} from '../services/review-queue.service.js';

function userIdFromRequest(req: Request) {
  if (!req.auth?.userId) {
    throw new Error('Authenticated user is missing from request.');
  }

  return req.auth.userId;
}

export async function getReviewSummaryController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getReviewSummary(userIdFromRequest(req));

    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getActiveReviewSessionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getActiveReviewSession(userIdFromRequest(req));

    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function startReviewSessionController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = startReviewSessionSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_REVIEW_SESSION_REQUEST',
        message: 'Review session request is invalid.',
      });
      return;
    }

    const data = await startReviewSession(
      userIdFromRequest(req),
      parsed.data.limit,
    );

    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
}

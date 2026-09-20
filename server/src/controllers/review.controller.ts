import type {
  NextFunction,
  Request,
  Response,
} from 'express';
import { ReviewRating } from '../generated/prisma/client.js';
import { answerWordSchema } from '../schemas/review.schema.js';
import { submitLearningAnswer } from '../services/review.service.js';

export async function submitLearningAnswerController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rawSessionId = req.params.sessionId;
    const sessionId = Array.isArray(rawSessionId)
      ? rawSessionId[0]
      : rawSessionId;

    if (!req.auth?.userId || !sessionId) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_SESSION_ID',
        message: 'Session id is invalid.',
      });
      return;
    }

    const parsed = answerWordSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_ANSWER',
        message: 'Learning answer payload is invalid.',
      });
      return;
    }

    const result = await submitLearningAnswer({
      userId: req.auth.userId,
      sessionId,
      wordId: parsed.data.wordId,
      rating: ReviewRating[parsed.data.rating],
      responseTimeMs: parsed.data.responseTimeMs,
      idempotencyKey: parsed.data.idempotencyKey,
      currentPosition: parsed.data.currentPosition,
    });

    res.status(200).json({
      status: 'ok',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

import type { RequestHandler } from 'express';
import { z } from 'zod';

const lessonParamsSchema = z.object({
  lessonId: z.string().uuid(),
});

const attemptParamsSchema = z.object({
  attemptId: z.string().uuid(),
});

export const startQuizSchema = z.object({
  limit: z.number().int().min(5).max(30).default(10),
});

export const answerQuizSchema = z.object({
  itemId: z.string().uuid(),
  selectedWordId: z.string().uuid(),
  responseTimeMs: z.number().int().min(0).max(300000),
  idempotencyKey: z.string().uuid(),
});

export const validateQuizLessonId: RequestHandler = (
  req,
  res,
  next,
) => {
  const result = lessonParamsSchema.safeParse(req.params);

  if (!result.success) {
    res.status(400).json({
      status: 'error',
      code: 'INVALID_LESSON_ID',
      message: 'Lesson id is invalid.',
    });
    return;
  }

  next();
};

export const validateQuizAttemptId: RequestHandler = (
  req,
  res,
  next,
) => {
  const result = attemptParamsSchema.safeParse(req.params);

  if (!result.success) {
    res.status(400).json({
      status: 'error',
      code: 'INVALID_QUIZ_ATTEMPT_ID',
      message: 'Quiz attempt id is invalid.',
    });
    return;
  }

  next();
};
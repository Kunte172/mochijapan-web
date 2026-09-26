import type { RequestHandler } from 'express';
import { z } from 'zod';

export const practiceQueueQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).default(10),
});

export const rateContentSchema = z.object({
  rating: z.enum(['AGAIN', 'HARD', 'GOOD', 'EASY']),
  responseTimeMs: z.number().int().min(0).max(300000),
  idempotencyKey: z.string().uuid(),
});

const grammarParamsSchema = z.object({
  grammarId: z.string().uuid(),
});

const kanjiParamsSchema = z.object({
  kanjiId: z.string().uuid(),
});

export const validateGrammarPracticeId: RequestHandler = (
  req,
  res,
  next,
) => {
  const result = grammarParamsSchema.safeParse(req.params);

  if (!result.success) {
    res.status(400).json({
      status: 'error',
      code: 'INVALID_GRAMMAR_ID',
      message: 'Grammar id is invalid.',
    });
    return;
  }

  next();
};

export const validateKanjiPracticeId: RequestHandler = (
  req,
  res,
  next,
) => {
  const result = kanjiParamsSchema.safeParse(req.params);

  if (!result.success) {
    res.status(400).json({
      status: 'error',
      code: 'INVALID_KANJI_ID',
      message: 'Kanji id is invalid.',
    });
    return;
  }

  next();
};

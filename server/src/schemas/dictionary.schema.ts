import type { RequestHandler } from 'express';
import { z } from 'zod';

export const dictionarySearchSchema = z.object({
  q: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(30).default(20),
});

const wordIdParamsSchema = z.object({
  wordId: z.string().uuid(),
});

export const validateDictionaryWordId: RequestHandler = (req, res, next) => {
  const result = wordIdParamsSchema.safeParse(req.params);

  if (!result.success) {
    res.status(400).json({
      status: 'error',
      code: 'INVALID_WORD_ID',
      message: 'Word id is invalid.',
    });
    return;
  }

  next();
};

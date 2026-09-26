import type { RequestHandler } from 'express';
import { z } from 'zod';

const jlptSchema = z.enum(['N5', 'N4', 'N3', 'N2', 'N1']);

export const grammarListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  jlpt: jlptSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const kanjiListQuerySchema = z.object({
  q: z.string().trim().max(30).optional(),
  jlpt: jlptSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(40),
});

const uuidParamSchema = z.object({
  grammarId: z.string().uuid(),
});

const kanjiParamSchema = z.object({
  character: z.string().trim().min(1).max(4),
});

export const validateGrammarId: RequestHandler = (req, res, next) => {
  const result = uuidParamSchema.safeParse(req.params);

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

export const validateKanjiCharacter: RequestHandler = (req, res, next) => {
  const result = kanjiParamSchema.safeParse(req.params);

  if (!result.success) {
    res.status(400).json({
      status: 'error',
      code: 'INVALID_KANJI_CHARACTER',
      message: 'Kanji character is invalid.',
    });
    return;
  }

  next();
};

import type { RequestHandler } from 'express';
import { z } from 'zod';
import { SavedWordSource } from '../generated/prisma/client.js';

const wordIdParamsSchema = z.object({
  wordId: z.string().uuid(),
});

export const notebookListSchema = z.object({
  q: z.string().trim().max(100).optional(),
  source: z.enum(SavedWordSource).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const saveWordSchema = z.object({
  source: z.enum(SavedWordSource).default(SavedWordSource.DICTIONARY),
  note: z.string().trim().max(1000).optional(),
});

export const updateSavedWordSchema = z.object({
  note: z.string().trim().max(1000).nullable(),
});

export const validateNotebookWordId: RequestHandler = (req, res, next) => {
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

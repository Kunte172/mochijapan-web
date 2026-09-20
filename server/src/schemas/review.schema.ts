import { z } from 'zod';

export const answerWordSchema = z.object({
  wordId: z.string().uuid(),
  rating: z.enum(['AGAIN', 'HARD', 'GOOD', 'EASY']),
  responseTimeMs: z.number().int().min(0).max(600000),
  idempotencyKey: z.string().min(16).max(100),
  currentPosition: z.number().int().min(1),
});

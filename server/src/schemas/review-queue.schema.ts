import { z } from 'zod';

export const startReviewSessionSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
});

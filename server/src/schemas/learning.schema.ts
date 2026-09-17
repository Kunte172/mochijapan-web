import { z } from 'zod';

export const updateLessonProgressSchema = z.object({
  currentPosition: z.number().int().min(0),
});

export const completeLessonSchema = z.object({
  sessionId: z.string().uuid().optional(),
});

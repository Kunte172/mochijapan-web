import type { RequestHandler } from 'express';
import { z } from 'zod';

const lessonIdParamsSchema = z.object({
  lessonId: z.string().uuid(),
});

export const validateLessonId: RequestHandler = (req, res, next) => {
  const result = lessonIdParamsSchema.safeParse(req.params);

  if (!result.success) {
    res.status(400).json({
      status: 'error',
      code: 'INVALID_LESSON_ID',
      message: 'Lesson id is invalid',
    });
    return;
  }

  next();
};

import type { RequestHandler } from 'express';
import { z } from 'zod';

const courseIdParamsSchema = z.object({
  courseId: z.string().uuid(),
});

export const validateCourseId: RequestHandler = (req, res, next) => {
  const result = courseIdParamsSchema.safeParse(req.params);

  if (!result.success) {
    res.status(400).json({
      status: 'error',
      code: 'INVALID_COURSE_ID',
      message: 'Course id is invalid',
    });

    return;
  }

  next();
};
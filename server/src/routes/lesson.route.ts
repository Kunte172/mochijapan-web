import { Router } from 'express';
import { getPublishedLessonById } from '../controllers/lesson.controller.js';
import { validateLessonId } from '../schemas/lesson.schema.js';

export const lessonRouter = Router();

lessonRouter.get(
  '/:lessonId',
  validateLessonId,
  getPublishedLessonById,
);

import { Router } from 'express';
import {
  completeMyLesson,
  getMyLessonProgress,
  startMyLesson,
  updateMyLessonProgress,
} from '../controllers/learning.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateLessonId } from '../schemas/lesson.schema.js';

export const learningRouter = Router();

learningRouter.use(requireAuth);

learningRouter.get(
  '/lessons/:lessonId/progress',
  validateLessonId,
  getMyLessonProgress,
);

learningRouter.post(
  '/lessons/:lessonId/start',
  validateLessonId,
  startMyLesson,
);

learningRouter.patch(
  '/lessons/:lessonId/progress',
  validateLessonId,
  updateMyLessonProgress,
);

learningRouter.post(
  '/lessons/:lessonId/complete',
  validateLessonId,
  completeMyLesson,
);

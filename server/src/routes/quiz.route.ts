import { Router } from 'express';
import {
  answerMyQuiz,
  getMyActiveQuiz,
  getMyQuizAttempt,
  startMyQuiz,
} from '../controllers/quiz.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  validateQuizAttemptId,
  validateQuizLessonId,
} from '../schemas/quiz.schema.js';

export const quizRouter = Router();

quizRouter.use(requireAuth);

quizRouter.get(
  '/lessons/:lessonId/active',
  validateQuizLessonId,
  getMyActiveQuiz,
);

quizRouter.post(
  '/lessons/:lessonId/start',
  validateQuizLessonId,
  startMyQuiz,
);

quizRouter.get(
  '/attempts/:attemptId',
  validateQuizAttemptId,
  getMyQuizAttempt,
);

quizRouter.post(
  '/attempts/:attemptId/answers',
  validateQuizAttemptId,
  answerMyQuiz,
);

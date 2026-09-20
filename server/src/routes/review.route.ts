import { Router } from 'express';
import { submitLearningAnswerController } from '../controllers/review.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const reviewRouter = Router();

reviewRouter.use(requireAuth);

reviewRouter.post(
  '/sessions/:sessionId/answers',
  submitLearningAnswerController,
);

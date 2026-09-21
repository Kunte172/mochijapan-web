import { Router } from 'express';
import {
  getActiveReviewSessionController,
  getReviewSummaryController,
  startReviewSessionController,
} from '../controllers/review-queue.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const reviewQueueRouter = Router();

reviewQueueRouter.use(requireAuth);

reviewQueueRouter.get(
  '/summary',
  getReviewSummaryController,
);

reviewQueueRouter.get(
  '/sessions/active',
  getActiveReviewSessionController,
);

reviewQueueRouter.post(
  '/sessions/start',
  startReviewSessionController,
);

import { Router } from 'express';
import { getMyLearningAnalytics } from '../controllers/analytics.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);
analyticsRouter.get('/learning', getMyLearningAnalytics);

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.route.js';
import { courseRouter } from './routes/course.route.js';
import { databaseRouter } from './routes/database.route.js';
import { healthRouter } from './routes/health.route.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { lessonRouter } from './routes/lesson.route.js';
import { learningRouter } from './routes/learning.route.js';
import { reviewRouter } from './routes/review.route.js';
import { reviewQueueRouter } from './routes/review-queue.route.js';
import { quizRouter } from './routes/quiz.route.js';
import { dictionaryRouter } from './routes/dictionary.route.js';
import { notebookRouter } from './routes/notebook.route.js';
import { analyticsRouter } from './routes/analytics.route.js';
import { languageContentRouter } from './routes/language-content.route.js';

export function createApp() {
  const app = express();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  app.use(helmet());
  app.use(
    cors({
      origin: frontendUrl,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/health', healthRouter);
  app.use('/api/database', databaseRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/courses', courseRouter);
  app.use('/api/lessons', lessonRouter);
  app.use('/api/learning', learningRouter);
  app.use('/api/learning', reviewRouter);
  app.use('/api/review', reviewQueueRouter);
  app.use('/api/quizzes', quizRouter);
  app.use('/api/dictionary', dictionaryRouter);
  app.use('/api/notebook', notebookRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/content', languageContentRouter);

  app.use(errorHandler);

  return app;
}

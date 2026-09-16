import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.route.js';
import { courseRouter } from './routes/course.route.js';
import { databaseRouter } from './routes/database.route.js';
import { healthRouter } from './routes/health.route.js';
import { errorHandler } from './middlewares/error.middleware.js';

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

  app.use(errorHandler);

  return app;
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { healthRouter } from './routes/health.route.js';
import { databaseRouter } from './routes/database.route.js';
import { authRouter } from './routes/auth.route.js';
import { errorHandler } from './middlewares/error.middleware.js';

export function createApp() {
  const app = express();

  app.use(helmet());

  app.use(
    cors({
      origin: 'http://localhost:5173',
      credentials: true,
    }),
  );

  app.use(express.json());

  app.use('/api/health', healthRouter);
  app.use('/api/database', databaseRouter);
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRouter);

  app.use(errorHandler);

  return app;
}
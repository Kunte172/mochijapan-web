import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { healthRouter } from './routes/health.route.js';

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

  return app;
}
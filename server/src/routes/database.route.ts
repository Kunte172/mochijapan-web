import { Router } from 'express';

import { prisma } from '../lib/prisma.js';

export const databaseRouter = Router();

databaseRouter.get('/health', async (_req, res) => {
  try {
    const courseCount = await prisma.course.count();

    res.status(200).json({
      status: 'ok',
      database: 'connected',
      courseCount,
    });
  } catch (error) {
    console.error('Database health check failed:', error);

    res.status(500).json({
      status: 'error',
      database: 'disconnected',
    });
  }
});
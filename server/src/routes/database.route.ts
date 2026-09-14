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

databaseRouter.get('/summary', async (_req, res) => {
  try {
    const [
      courseCount,
      lessonCount,
      wordCount,
      userCount,
      lessonProgressCount,
      userWordStateCount,
      reviewEventCount,
      studySessionCount,
      savedWordCount,
    ] = await Promise.all([
      prisma.course.count(),
      prisma.lesson.count(),
      prisma.word.count(),
      prisma.user.count(),
      prisma.lessonProgress.count(),
      prisma.userWordState.count(),
      prisma.reviewEvent.count(),
      prisma.studySession.count(),
      prisma.savedWord.count(),
    ]);

    res.status(200).json({
      status: 'ok',
      counts: {
        courses: courseCount,
        lessons: lessonCount,
        words: wordCount,
        users: userCount,
        lessonProgress: lessonProgressCount,
        userWordStates: userWordStateCount,
        reviewEvents: reviewEventCount,
        studySessions: studySessionCount,
        savedWords: savedWordCount,
      },
    });
  } catch (error) {
    console.error('Database summary failed:', error);

    res.status(500).json({
      status: 'error',
      message: 'Cannot read database summary',
    });
  }
});
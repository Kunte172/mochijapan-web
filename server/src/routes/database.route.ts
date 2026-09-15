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
      lessonWordCount,
      exampleCount,
      userCount,
      lessonProgressCount,
      userWordStateCount,
      reviewEventCount,
      studySessionCount,
      savedWordCount,
      authSessionCount,
      accountActionTokenCount,
    ] = await Promise.all([
      prisma.course.count(),
      prisma.lesson.count(),
      prisma.word.count(),
      prisma.lessonWord.count(),
      prisma.exampleSentence.count(),
      prisma.user.count(),
      prisma.lessonProgress.count(),
      prisma.userWordState.count(),
      prisma.reviewEvent.count(),
      prisma.studySession.count(),
      prisma.savedWord.count(),
      prisma.authSession.count(),
      prisma.accountActionToken.count(),
    ]);

    res.status(200).json({
      status: 'ok',
      counts: {
        courses: courseCount,
        lessons: lessonCount,
        words: wordCount,
        lessonWords: lessonWordCount,
        examples: exampleCount,
        users: userCount,
        lessonProgress: lessonProgressCount,
        userWordStates: userWordStateCount,
        reviewEvents: reviewEventCount,
        studySessions: studySessionCount,
        savedWords: savedWordCount,
        authSessions: authSessionCount,
        accountActionTokens: accountActionTokenCount,
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

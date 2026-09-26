import {
  LessonProgressStatus,
  QuizAttemptStatus,
  StudySessionStatus,
} from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

export const analyticsRepository = {
  countLearnedWords(userId: string) {
    return prisma.userWordState.count({ where: { userId } });
  },
  countSavedWords(userId: string) {
    return prisma.savedWord.count({ where: { userId } });
  },
  countCompletedLessons(userId: string) {
    return prisma.lessonProgress.count({
      where: { userId, status: LessonProgressStatus.COMPLETED },
    });
  },
  countDueWords(userId: string, now: Date) {
    return prisma.userWordState.count({
      where: { userId, nextReviewAt: { lte: now } },
    });
  },
  masteryStates(userId: string) {
    return prisma.userWordState.findMany({
      where: { userId },
      select: { masteryLevel: true },
    });
  },
  reviewEventsSince(userId: string, since: Date) {
    return prisma.reviewEvent.findMany({
      where: { userId, reviewedAt: { gte: since } },
      orderBy: { reviewedAt: 'asc' },
      select: { isCorrect: true, reviewedAt: true, responseTimeMs: true },
    });
  },
  completedSessionsSince(userId: string, since: Date) {
    return prisma.studySession.findMany({
      where: {
        userId,
        status: StudySessionStatus.COMPLETED,
        startedAt: { gte: since },
      },
      orderBy: { startedAt: 'asc' },
      select: {
        type: true,
        totalItems: true,
        correctItems: true,
        startedAt: true,
        endedAt: true,
      },
    });
  },
  completedQuizzesSince(userId: string, since: Date) {
    return prisma.quizAttempt.findMany({
      where: {
        userId,
        status: QuizAttemptStatus.COMPLETED,
        startedAt: { gte: since },
      },
      select: {
        totalQuestions: true,
        correctAnswers: true,
        completedAt: true,
      },
    });
  },
  difficultWords(userId: string, take: number) {
    return prisma.userWordState.findMany({
      where: { userId },
      orderBy: [
        { lapseCount: 'desc' },
        { incorrectCount: 'desc' },
        { masteryLevel: 'asc' },
      ],
      take,
      select: {
        masteryLevel: true,
        memoryStrength: true,
        correctCount: true,
        incorrectCount: true,
        lapseCount: true,
        reviewCount: true,
        streak: true,
        nextReviewAt: true,
        word: {
          select: {
            id: true,
            writtenForm: true,
            reading: true,
            meaningVi: true,
            meaningEn: true,
          },
        },
      },
    });
  },
  allReviewDates(userId: string, since: Date) {
    return prisma.reviewEvent.findMany({
      where: { userId, reviewedAt: { gte: since } },
      orderBy: { reviewedAt: 'desc' },
      select: { reviewedAt: true },
    });
  },
};

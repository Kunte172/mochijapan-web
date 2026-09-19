import {
  ContentStatus,
  LessonProgressStatus,
  StudySessionStatus,
  StudySessionType,
} from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

export const learningRepository = {
  findPublishedLessonSummary(lessonId: string) {
    return prisma.lesson.findFirst({
      where: {
        id: lessonId,
        status: ContentStatus.PUBLISHED,
        course: { status: ContentStatus.PUBLISHED },
      },
      select: {
        id: true,
        title: true,
        _count: { select: { lessonWords: true } },
        lessonWords: {
          orderBy: { position: 'asc' },
          select: { wordId: true },
        },
      },
    });
  },

  findProgress(userId: string, lessonId: string) {
    return prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
  },

  async startLesson(userId: string, lessonId: string, totalItems: number) {
    return prisma.$transaction(async (tx) => {
      const existingProgress = await tx.lessonProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
      });

      const progress = existingProgress
        ? await tx.lessonProgress.update({
            where: { id: existingProgress.id },
            data: { lastStudiedAt: new Date() },
          })
        : await tx.lessonProgress.create({
            data: {
              userId,
              lessonId,
              status: LessonProgressStatus.IN_PROGRESS,
              currentPosition: 0,
            },
          });
      const now = new Date();

      await tx.studySession.updateMany({
        where: {
          userId,
          type: StudySessionType.LEARNING,
          status: StudySessionStatus.ACTIVE,
          NOT: {
            lessonId,
          },
        },
        data: {
          status: StudySessionStatus.ABANDONED,
          endedAt: now,
        },
      });
      const activeSession = await tx.studySession.findFirst({
        where: {
          userId,
          lessonId,
          type: StudySessionType.LEARNING,
          status: StudySessionStatus.ACTIVE,
        },
        orderBy: { startedAt: 'desc' },
      });

      const session = activeSession ?? await tx.studySession.create({
        data: {
          userId,
          lessonId,
          type: StudySessionType.LEARNING,
          status: StudySessionStatus.ACTIVE,
          totalItems,
        },
      });

      return { progress, session };
    });
  },

  updateProgress(progressId: string, currentPosition: number) {
    return prisma.lessonProgress.update({
      where: { id: progressId },
      data: { currentPosition, lastStudiedAt: new Date() },
    });
  },

  async completeLesson(args: {
    userId: string;
    lessonId: string;
    sessionId?: string;
    wordIds: string[];
  }) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const progress = await tx.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: args.userId,
            lessonId: args.lessonId,
          },
        },
        create: {
          userId: args.userId,
          lessonId: args.lessonId,
          status: LessonProgressStatus.COMPLETED,
          currentPosition: args.wordIds.length,
          completedAt: now,
          lastStudiedAt: now,
        },
        update: {
          status: LessonProgressStatus.COMPLETED,
          currentPosition: args.wordIds.length,
          completedAt: now,
          lastStudiedAt: now,
        },
      });

      const existingStates = await tx.userWordState.findMany({
        where: {
          userId: args.userId,
          wordId: { in: args.wordIds },
        },
        select: { wordId: true },
      });

      const existingWordIds = new Set(existingStates.map((item) => item.wordId));
      const missingWordIds = args.wordIds.filter((wordId) => !existingWordIds.has(wordId));

      if (missingWordIds.length > 0) {
        await tx.userWordState.createMany({
          data: missingWordIds.map((wordId) => ({
            userId: args.userId,
            wordId,
            masteryLevel: 1,
            memoryStrength: 1,
            firstLearnedAt: now,
            nextReviewAt: now,
          })),
          skipDuplicates: true,
        });
      }

      if (args.sessionId) {
        await tx.studySession.updateMany({
          where: {
            id: args.sessionId,
            userId: args.userId,
            lessonId: args.lessonId,
            status: StudySessionStatus.ACTIVE,
          },
          data: {
            status: StudySessionStatus.COMPLETED,
            correctItems: args.wordIds.length,
            endedAt: now,
          },
        });
      }

      return progress;
    });
  },
};

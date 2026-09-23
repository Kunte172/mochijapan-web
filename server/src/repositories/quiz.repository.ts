import {
  ContentStatus,
  Prisma,
  QuizAttemptStatus,
  QuizQuestionType,
  ReviewRating,
  StudySessionStatus,
  StudySessionType,
} from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';
import { applyReviewRating } from '../services/review-policy.service.js';

const attemptInclude = {
  lesson: {
    select: {
      id: true,
      title: true,
      titleEn: true,
    },
  },
  session: {
    select: {
      id: true,
      type: true,
      status: true,
      totalItems: true,
      correctItems: true,
      startedAt: true,
      endedAt: true,
    },
  },
  items: {
    orderBy: {
      position: 'asc',
    },
    include: {
      word: {
        select: {
          id: true,
          writtenForm: true,
          reading: true,
          romaji: true,
          meaningVi: true,
          meaningEn: true,
          audioUrl: true,
        },
      },
    },
  },
} satisfies Prisma.QuizAttemptInclude;

export type QuizAttemptRecord = Prisma.QuizAttemptGetPayload<{
  include: typeof attemptInclude;
}>;

export const quizRepository = {
  findLessonCandidates(userId: string, lessonId: string) {
    return prisma.lesson.findFirst({
      where: {
        id: lessonId,
        status: ContentStatus.PUBLISHED,
        course: {
          status: ContentStatus.PUBLISHED,
        },
      },
      select: {
        id: true,
        title: true,
        lessonWords: {
          orderBy: {
            position: 'asc',
          },
          select: {
            position: true,
            word: {
              select: {
                id: true,
                writtenForm: true,
                reading: true,
                meaningVi: true,
                audioUrl: true,
                userStates: {
                  where: {
                    userId,
                  },
                  take: 1,
                  select: {
                    masteryLevel: true,
                    incorrectCount: true,
                    reviewCount: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  },

  findActiveAttempt(userId: string, lessonId: string) {
    return prisma.quizAttempt.findFirst({
      where: {
        userId,
        lessonId,
        status: QuizAttemptStatus.ACTIVE,
      },
      orderBy: {
        startedAt: 'desc',
      },
      include: attemptInclude,
    });
  },

  findAttempt(userId: string, attemptId: string) {
    return prisma.quizAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
      },
      include: attemptInclude,
    });
  },

  findWordsByIds(ids: string[]) {
    return prisma.word.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        writtenForm: true,
        reading: true,
        meaningVi: true,
      },
    });
  },

  async createAttempt(args: {
    userId: string;
    lessonId: string;
    plan: Array<{
      wordId: string;
      position: number;
      questionType: QuizQuestionType;
      optionWordIds: string[];
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      const now = new Date();

      const activeOthers = await tx.quizAttempt.findMany({
        where: {
          userId: args.userId,
          status: QuizAttemptStatus.ACTIVE,
          NOT: {
            lessonId: args.lessonId,
          },
        },
        select: {
          id: true,
          sessionId: true,
        },
      });

      if (activeOthers.length > 0) {
        await tx.quizAttempt.updateMany({
          where: {
            id: {
              in: activeOthers.map((attempt) => attempt.id),
            },
          },
          data: {
            status: QuizAttemptStatus.ABANDONED,
            completedAt: now,
          },
        });

        await tx.studySession.updateMany({
          where: {
            id: {
              in: activeOthers.map((attempt) => attempt.sessionId),
            },
            status: StudySessionStatus.ACTIVE,
          },
          data: {
            status: StudySessionStatus.ABANDONED,
            endedAt: now,
          },
        });
      }

      const session = await tx.studySession.create({
        data: {
          userId: args.userId,
          lessonId: args.lessonId,
          type: StudySessionType.SMART_STUDY,
          status: StudySessionStatus.ACTIVE,
          totalItems: args.plan.length,
        },
      });

      return tx.quizAttempt.create({
        data: {
          userId: args.userId,
          lessonId: args.lessonId,
          sessionId: session.id,
          totalQuestions: args.plan.length,
          items: {
            create: args.plan,
          },
        },
        include: attemptInclude,
      });
    });
  },

  async submitAnswer(args: {
    userId: string;
    attemptId: string;
    itemId: string;
    selectedWordId: string;
    responseTimeMs: number;
    idempotencyKey: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const retryItem = await tx.quizAttemptItem.findUnique({
        where: {
          answerIdempotencyKey: args.idempotencyKey,
        },
        include: {
          attempt: true,
        },
      });

      if (retryItem) {
        if (
          retryItem.attempt.userId !== args.userId ||
          retryItem.attemptId !== args.attemptId ||
          retryItem.id !== args.itemId ||
          retryItem.selectedWordId !== args.selectedWordId
        ) {
          throw new AppError(
            409,
            'IDEMPOTENCY_KEY_CONFLICT',
            'Idempotency key is already used by another quiz answer.',
          );
        }

        return {
          item: retryItem,
          idempotent: true,
          attemptCompleted:
            retryItem.attempt.status === QuizAttemptStatus.COMPLETED,
        };
      }

      const item = await tx.quizAttemptItem.findFirst({
        where: {
          id: args.itemId,
          attemptId: args.attemptId,
          attempt: {
            userId: args.userId,
            status: QuizAttemptStatus.ACTIVE,
          },
        },
        include: {
          attempt: true,
        },
      });

      if (!item) {
        throw new AppError(
          404,
          'QUIZ_ITEM_NOT_FOUND',
          'Active quiz question was not found.',
        );
      }

      if (item.answeredAt) {
        throw new AppError(
          409,
          'QUIZ_ANSWER_ALREADY_RECORDED',
          'This quiz question has already been answered.',
        );
      }

      if (!item.optionWordIds.includes(args.selectedWordId)) {
        throw new AppError(
          400,
          'QUIZ_OPTION_INVALID',
          'Selected option does not belong to this question.',
        );
      }

      const isCorrect = args.selectedWordId === item.wordId;
      const rating = isCorrect ? ReviewRating.GOOD : ReviewRating.AGAIN;
      const now = new Date();

      const currentState = await tx.userWordState.findUnique({
        where: {
          userId_wordId: {
            userId: args.userId,
            wordId: item.wordId,
          },
        },
      });

      const next = applyReviewRating({
        current: currentState,
        rating,
        responseTimeMs: args.responseTimeMs,
        now,
      });

      const state = await tx.userWordState.upsert({
        where: {
          userId_wordId: {
            userId: args.userId,
            wordId: item.wordId,
          },
        },
        create: {
          userId: args.userId,
          wordId: item.wordId,
          masteryLevel: next.masteryLevel,
          memoryStrength: next.memoryStrength,
          firstLearnedAt: now,
          lastReviewedAt: next.lastReviewedAt,
          nextReviewAt: next.nextReviewAt,
          correctCount: next.correctCount,
          incorrectCount: next.incorrectCount,
          lapseCount: next.lapseCount,
          reviewCount: next.reviewCount,
          streak: next.streak,
          averageResponseTimeMs: next.averageResponseTimeMs,
        },
        update: {
          masteryLevel: next.masteryLevel,
          memoryStrength: next.memoryStrength,
          lastReviewedAt: next.lastReviewedAt,
          nextReviewAt: next.nextReviewAt,
          correctCount: next.correctCount,
          incorrectCount: next.incorrectCount,
          lapseCount: next.lapseCount,
          reviewCount: next.reviewCount,
          streak: next.streak,
          averageResponseTimeMs: next.averageResponseTimeMs,
        },
      });

      const event = await tx.reviewEvent.create({
        data: {
          userId: args.userId,
          wordId: item.wordId,
          sessionId: item.attempt.sessionId,
          isCorrect,
          rating,
          responseTimeMs: args.responseTimeMs,
          previousMasteryLevel: next.previousMasteryLevel,
          newMasteryLevel: next.masteryLevel,
          previousMemoryStrength: next.previousMemoryStrength,
          newMemoryStrength: next.memoryStrength,
          idempotencyKey: args.idempotencyKey,
          reviewedAt: now,
        },
      });

      const updatedItem = await tx.quizAttemptItem.update({
        where: {
          id: item.id,
        },
        data: {
          selectedWordId: args.selectedWordId,
          isCorrect,
          responseTimeMs: args.responseTimeMs,
          answerIdempotencyKey: args.idempotencyKey,
          answeredAt: now,
        },
      });

      if (isCorrect) {
        await tx.quizAttempt.update({
          where: {
            id: args.attemptId,
          },
          data: {
            correctAnswers: {
              increment: 1,
            },
          },
        });

        await tx.studySession.update({
          where: {
            id: item.attempt.sessionId,
          },
          data: {
            correctItems: {
              increment: 1,
            },
          },
        });
      }

      const remaining = await tx.quizAttemptItem.count({
        where: {
          attemptId: args.attemptId,
          answeredAt: null,
        },
      });

      let attemptCompleted = false;

      if (remaining === 0) {
        attemptCompleted = true;

        await tx.quizAttempt.update({
          where: {
            id: args.attemptId,
          },
          data: {
            status: QuizAttemptStatus.COMPLETED,
            completedAt: now,
          },
        });

        await tx.studySession.update({
          where: {
            id: item.attempt.sessionId,
          },
          data: {
            status: StudySessionStatus.COMPLETED,
            endedAt: now,
          },
        });
      }

      return {
        item: updatedItem,
        event,
        state,
        idempotent: false,
        attemptCompleted,
      };
    });
  },
};

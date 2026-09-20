import {
  LessonProgressStatus,
  ReviewRating,
  StudySessionStatus,
  StudySessionType,
} from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';
import { applyReviewRating } from '../services/review-policy.service.js';

export const reviewRepository = {
  async submitAnswer(args: {
    userId: string;
    sessionId: string;
    wordId: string;
    rating: ReviewRating;
    responseTimeMs: number;
    idempotencyKey: string;
    currentPosition: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const existingByKey = await tx.reviewEvent.findUnique({
        where: {
          idempotencyKey: args.idempotencyKey,
        },
      });

      if (existingByKey) {
        if (
          existingByKey.userId !== args.userId ||
          existingByKey.sessionId !== args.sessionId ||
          existingByKey.wordId !== args.wordId
        ) {
          throw new AppError(
            409,
            'IDEMPOTENCY_KEY_CONFLICT',
            'Idempotency key is already used by another answer.',
          );
        }

        const state = await tx.userWordState.findUnique({
          where: {
            userId_wordId: {
              userId: args.userId,
              wordId: args.wordId,
            },
          },
        });

        return {
          event: existingByKey,
          state,
          idempotent: true,
        };
      }

      const session = await tx.studySession.findFirst({
        where: {
          id: args.sessionId,
          userId: args.userId,
          type: StudySessionType.LEARNING,
          status: StudySessionStatus.ACTIVE,
        },
      });

      if (!session || !session.lessonId) {
        throw new AppError(
          404,
          'LEARNING_SESSION_NOT_FOUND',
          'Active learning session was not found.',
        );
      }

      const lessonWord = await tx.lessonWord.findUnique({
        where: {
          lessonId_wordId: {
            lessonId: session.lessonId,
            wordId: args.wordId,
          },
        },
      });

      if (!lessonWord) {
        throw new AppError(
          400,
          'WORD_NOT_IN_SESSION_LESSON',
          'Word does not belong to this learning session lesson.',
        );
      }

      const existingAnswer = await tx.reviewEvent.findFirst({
        where: {
          sessionId: args.sessionId,
          wordId: args.wordId,
        },
      });

      if (existingAnswer) {
        throw new AppError(
          409,
          'ANSWER_ALREADY_RECORDED',
          'This word has already been rated in the current session.',
        );
      }

      const currentState = await tx.userWordState.findUnique({
        where: {
          userId_wordId: {
            userId: args.userId,
            wordId: args.wordId,
          },
        },
      });

      const now = new Date();
      const next = applyReviewRating({
        current: currentState,
        rating: args.rating,
        responseTimeMs: args.responseTimeMs,
        now,
      });

      const state = await tx.userWordState.upsert({
        where: {
          userId_wordId: {
            userId: args.userId,
            wordId: args.wordId,
          },
        },
        create: {
          userId: args.userId,
          wordId: args.wordId,
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
          wordId: args.wordId,
          sessionId: args.sessionId,
          isCorrect: next.isCorrect,
          rating: args.rating,
          responseTimeMs: args.responseTimeMs,
          previousMasteryLevel: next.previousMasteryLevel,
          newMasteryLevel: next.masteryLevel,
          previousMemoryStrength: next.previousMemoryStrength,
          newMemoryStrength: next.memoryStrength,
          idempotencyKey: args.idempotencyKey,
          reviewedAt: now,
        },
      });

      if (next.isCorrect) {
        await tx.studySession.update({
          where: {
            id: args.sessionId,
          },
          data: {
            correctItems: {
              increment: 1,
            },
          },
        });
      }

      const progress = await tx.lessonProgress.findUnique({
        where: {
          userId_lessonId: {
            userId: args.userId,
            lessonId: session.lessonId,
          },
        },
      });

      if (progress && progress.status !== LessonProgressStatus.COMPLETED) {
        const boundedPosition = Math.min(
          args.currentPosition,
          session.totalItems,
        );
        const nextPosition = Math.max(
          progress.currentPosition,
          boundedPosition,
        );

        if (nextPosition !== progress.currentPosition) {
          await tx.lessonProgress.update({
            where: {
              id: progress.id,
            },
            data: {
              currentPosition: nextPosition,
              lastStudiedAt: now,
            },
          });
        }
      }

      return {
        event,
        state,
        idempotent: false,
      };
    });
  },
};

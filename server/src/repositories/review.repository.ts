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
        const session = await tx.studySession.findUnique({
          where: {
            id: args.sessionId,
          },
        });
        const remainingItems = session?.type === StudySessionType.REVIEW
          ? await tx.studySessionItem.count({
              where: {
                sessionId: args.sessionId,
                answeredAt: null,
              },
            })
          : Math.max(
              (session?.totalItems ?? args.currentPosition) - args.currentPosition,
              0,
            );

        return {
          event: existingByKey,
          state,
          idempotent: true,
          sessionType: session?.type ?? null,
          remainingItems,
          sessionCompleted: session?.status === StudySessionStatus.COMPLETED,
        };
      }

      const session = await tx.studySession.findFirst({
        where: {
          id: args.sessionId,
          userId: args.userId,
          type: {
            in: [
              StudySessionType.LEARNING,
              StudySessionType.REVIEW,
            ],
          },
          status: StudySessionStatus.ACTIVE,
        },
      });

      if (!session) {
        throw new AppError(
          404,
          'STUDY_SESSION_NOT_FOUND',
          'Active study session was not found.',
        );
      }

      if (session.type === StudySessionType.LEARNING) {
        if (!session.lessonId) {
          throw new AppError(
            400,
            'LEARNING_SESSION_LESSON_MISSING',
            'Learning session does not have a lesson.',
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
      }

      if (session.type === StudySessionType.REVIEW) {
        const sessionItem = await tx.studySessionItem.findUnique({
          where: {
            sessionId_wordId: {
              sessionId: session.id,
              wordId: args.wordId,
            },
          },
        });

        if (!sessionItem) {
          throw new AppError(
            400,
            'WORD_NOT_IN_REVIEW_SESSION',
            'Word does not belong to this review session.',
          );
        }
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

      let remainingItems = Math.max(
        session.totalItems - args.currentPosition,
        0,
      );
      let sessionCompleted = false;

      if (session.type === StudySessionType.LEARNING && session.lessonId) {
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
      }

      if (session.type === StudySessionType.REVIEW) {
        await tx.studySessionItem.update({
          where: {
            sessionId_wordId: {
              sessionId: session.id,
              wordId: args.wordId,
            },
          },
          data: {
            answeredAt: now,
          },
        });

        remainingItems = await tx.studySessionItem.count({
          where: {
            sessionId: session.id,
            answeredAt: null,
          },
        });

        if (remainingItems === 0) {
          await tx.studySession.update({
            where: {
              id: session.id,
            },
            data: {
              status: StudySessionStatus.COMPLETED,
              endedAt: now,
            },
          });
          sessionCompleted = true;
        }
      }

      return {
        event,
        state,
        idempotent: false,
        sessionType: session.type,
        remainingItems,
        sessionCompleted,
      };
    });
  },
};

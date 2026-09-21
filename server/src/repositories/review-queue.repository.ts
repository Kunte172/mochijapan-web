import {
  Prisma,
  StudySessionStatus,
  StudySessionType,
} from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

const reviewSessionSelect = {
  id: true,
  userId: true,
  type: true,
  status: true,
  totalItems: true,
  correctItems: true,
  startedAt: true,
  endedAt: true,
  items: {
    orderBy: {
      position: 'asc',
    },
    select: {
      id: true,
      position: true,
      scheduledFor: true,
      priorityScore: true,
      answeredAt: true,
      word: {
        select: {
          id: true,
          sourceWordId: true,
          writtenForm: true,
          reading: true,
          romaji: true,
          meaningVi: true,
          meaningEn: true,
          partOfSpeech: true,
          audioUrl: true,
          pictureUrl: true,
          examples: {
            take: 1,
            orderBy: {
              createdAt: 'asc',
            },
            select: {
              id: true,
              japanese: true,
              vietnamese: true,
              english: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.StudySessionSelect;

export type ReviewSessionRecord = Prisma.StudySessionGetPayload<{
  select: typeof reviewSessionSelect;
}>;

export const reviewQueueRepository = {
  countDueNow(userId: string, now: Date) {
    return prisma.userWordState.count({
      where: {
        userId,
        nextReviewAt: {
          lte: now,
        },
      },
    });
  },

  countGoldenWindow(
    userId: string,
    windowStart: Date,
    windowEnd: Date,
  ) {
    return prisma.userWordState.count({
      where: {
        userId,
        nextReviewAt: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
    });
  },

  countDueNext24Hours(
    userId: string,
    now: Date,
    next24Hours: Date,
  ) {
    return prisma.userWordState.count({
      where: {
        userId,
        nextReviewAt: {
          gt: now,
          lte: next24Hours,
        },
      },
    });
  },

  countLearnedWords(userId: string) {
    return prisma.userWordState.count({
      where: {
        userId,
      },
    });
  },

  countReviewedSince(userId: string, since: Date) {
    return prisma.reviewEvent.count({
      where: {
        userId,
        reviewedAt: {
          gte: since,
        },
      },
    });
  },

  findNextReview(userId: string, now: Date) {
    return prisma.userWordState.findFirst({
      where: {
        userId,
        nextReviewAt: {
          gt: now,
        },
      },
      orderBy: {
        nextReviewAt: 'asc',
      },
      select: {
        nextReviewAt: true,
      },
    });
  },

  masteryDistribution(userId: string) {
    return prisma.userWordState.groupBy({
      by: ['masteryLevel'],
      where: {
        userId,
      },
      _count: {
        _all: true,
      },
      orderBy: {
        masteryLevel: 'asc',
      },
    });
  },

  findDueCandidates(userId: string, now: Date, take: number) {
    return prisma.userWordState.findMany({
      where: {
        userId,
        nextReviewAt: {
          lte: now,
        },
      },
      orderBy: [
        {
          nextReviewAt: 'asc',
        },
        {
          masteryLevel: 'asc',
        },
        {
          lapseCount: 'desc',
        },
      ],
      take,
      select: {
        wordId: true,
        masteryLevel: true,
        memoryStrength: true,
        lapseCount: true,
        nextReviewAt: true,
      },
    });
  },

  findActiveSession(userId: string): Promise<ReviewSessionRecord | null> {
    return prisma.studySession.findFirst({
      where: {
        userId,
        type: StudySessionType.REVIEW,
        status: StudySessionStatus.ACTIVE,
      },
      orderBy: {
        startedAt: 'desc',
      },
      select: reviewSessionSelect,
    });
  },

  async createSession(
    userId: string,
    items: Array<{
      wordId: string;
      position: number;
      scheduledFor: Date | null;
      priorityScore: number;
    }>,
  ): Promise<ReviewSessionRecord> {
    return prisma.$transaction(async (tx) => {
      const session = await tx.studySession.create({
        data: {
          userId,
          type: StudySessionType.REVIEW,
          status: StudySessionStatus.ACTIVE,
          totalItems: items.length,
        },
      });

      await tx.studySessionItem.createMany({
        data: items.map((item) => ({
          sessionId: session.id,
          wordId: item.wordId,
          position: item.position,
          scheduledFor: item.scheduledFor,
          priorityScore: item.priorityScore,
        })),
      });

      const created = await tx.studySession.findUnique({
        where: {
          id: session.id,
        },
        select: reviewSessionSelect,
      });

      if (!created) {
        throw new Error('Review session could not be loaded after creation.');
      }

      return created;
    });
  },
};

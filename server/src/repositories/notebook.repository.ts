import type { SavedWordSource } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

function wordSearch(query: string | undefined) {
  if (!query) {
    return undefined;
  }

  return {
    OR: [
      {
        writtenForm: {
          contains: query,
          mode: 'insensitive' as const,
        },
      },
      {
        reading: {
          contains: query,
          mode: 'insensitive' as const,
        },
      },
      {
        romaji: {
          contains: query,
          mode: 'insensitive' as const,
        },
      },
      {
        meaningVi: {
          contains: query,
          mode: 'insensitive' as const,
        },
      },
      {
        meaningEn: {
          contains: query,
          mode: 'insensitive' as const,
        },
      },
    ],
  };
}

function wordSelect(userId: string) {
  return {
    id: true,
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
        createdAt: 'asc' as const,
      },
      select: {
        id: true,
        japanese: true,
        vietnamese: true,
        english: true,
      },
    },
    userStates: {
      where: {
        userId,
      },
      take: 1,
      select: {
        masteryLevel: true,
        memoryStrength: true,
        lastReviewedAt: true,
        nextReviewAt: true,
        correctCount: true,
        incorrectCount: true,
        lapseCount: true,
        reviewCount: true,
        streak: true,
      },
    },
  };
}

export const notebookRepository = {
  findWord(wordId: string) {
    return prisma.word.findUnique({
      where: {
        id: wordId,
      },
      select: {
        id: true,
      },
    });
  },

  findSavedWord(userId: string, wordId: string) {
    return prisma.savedWord.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId,
        },
      },
      select: {
        id: true,
        userId: true,
        wordId: true,
        source: true,
        note: true,
        createdAt: true,
        updatedAt: true,
        word: {
          select: wordSelect(userId),
        },
      },
    });
  },

  saveWord(args: {
    userId: string;
    wordId: string;
    source: SavedWordSource;
    note?: string;
  }) {
    return prisma.savedWord.upsert({
      where: {
        userId_wordId: {
          userId: args.userId,
          wordId: args.wordId,
        },
      },
      create: {
        userId: args.userId,
        wordId: args.wordId,
        source: args.source,
        note: args.note,
      },
      update: {},
      select: {
        id: true,
        userId: true,
        wordId: true,
        source: true,
        note: true,
        createdAt: true,
        updatedAt: true,
        word: {
          select: wordSelect(args.userId),
        },
      },
    });
  },

  updateNote(userId: string, wordId: string, note: string | null) {
    return prisma.savedWord.update({
      where: {
        userId_wordId: {
          userId,
          wordId,
        },
      },
      data: {
        note,
      },
      select: {
        id: true,
        userId: true,
        wordId: true,
        source: true,
        note: true,
        createdAt: true,
        updatedAt: true,
        word: {
          select: wordSelect(userId),
        },
      },
    });
  },

  deleteWord(userId: string, wordId: string) {
    return prisma.savedWord.deleteMany({
      where: {
        userId,
        wordId,
      },
    });
  },

  async list(args: {
    userId: string;
    query?: string;
    source?: SavedWordSource;
    page: number;
    pageSize: number;
  }) {
    const where = {
      userId: args.userId,
      ...(args.source ? { source: args.source } : {}),
      ...(args.query
        ? {
            word: wordSearch(args.query),
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.savedWord.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (args.page - 1) * args.pageSize,
        take: args.pageSize,
        select: {
          id: true,
          userId: true,
          wordId: true,
          source: true,
          note: true,
          createdAt: true,
          updatedAt: true,
          word: {
            select: wordSelect(args.userId),
          },
        },
      }),
      prisma.savedWord.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  },

  async summary(userId: string, now: Date) {
    const [total, dueNow, sources] = await prisma.$transaction([
      prisma.savedWord.count({
        where: {
          userId,
        },
      }),
      prisma.savedWord.count({
        where: {
          userId,
          word: {
            userStates: {
              some: {
                userId,
                nextReviewAt: {
                  lte: now,
                },
              },
            },
          },
        },
      }),
      prisma.savedWord.groupBy({
        by: ['source'],
        where: {
          userId,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

    return {
      total,
      dueNow,
      sources,
    };
  },
};

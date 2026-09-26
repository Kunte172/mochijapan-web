import { ContentStatus } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

export const contentPracticeRepository = {
  countDueGrammar(userId: string, now: Date) {
    return prisma.userGrammarState.count({
      where: {
        userId,
        nextReviewAt: { lte: now },
      },
    });
  },

  countDueKanji(userId: string, now: Date) {
    return prisma.userKanjiState.count({
      where: {
        userId,
        nextReviewAt: { lte: now },
      },
    });
  },

  countNewGrammar(userId: string) {
    return prisma.grammarPoint.count({
      where: {
        status: ContentStatus.PUBLISHED,
        userStates: {
          none: { userId },
        },
      },
    });
  },

  countNewKanji(userId: string) {
    return prisma.kanji.count({
      where: {
        status: ContentStatus.PUBLISHED,
        userStates: {
          none: { userId },
        },
      },
    });
  },

  findDueGrammar(userId: string, now: Date, take: number) {
    return prisma.userGrammarState.findMany({
      where: {
        userId,
        nextReviewAt: { lte: now },
        grammarPoint: {
          status: ContentStatus.PUBLISHED,
        },
      },
      orderBy: [
        { masteryLevel: 'asc' },
        { nextReviewAt: 'asc' },
      ],
      take,
      select: {
        masteryLevel: true,
        memoryStrength: true,
        nextReviewAt: true,
        incorrectCount: true,
        lapseCount: true,
        reviewCount: true,
        grammarPoint: {
          select: {
            id: true,
            pattern: true,
            meaningVi: true,
            meaningEn: true,
            explanationVi: true,
            explanationEn: true,
            formation: true,
            jlptLevel: true,
            examples: {
              orderBy: { sortOrder: 'asc' },
              take: 2,
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
    });
  },

  findNewGrammar(userId: string, take: number) {
    return prisma.grammarPoint.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        userStates: {
          none: { userId },
        },
      },
      orderBy: [
        { jlptLevel: 'asc' },
        { code: 'asc' },
      ],
      take,
      select: {
        id: true,
        pattern: true,
        meaningVi: true,
        meaningEn: true,
        explanationVi: true,
        explanationEn: true,
        formation: true,
        jlptLevel: true,
        examples: {
          orderBy: { sortOrder: 'asc' },
          take: 2,
          select: {
            id: true,
            japanese: true,
            vietnamese: true,
            english: true,
          },
        },
      },
    });
  },

  findDueKanji(userId: string, now: Date, take: number) {
    return prisma.userKanjiState.findMany({
      where: {
        userId,
        nextReviewAt: { lte: now },
        kanji: {
          status: ContentStatus.PUBLISHED,
        },
      },
      orderBy: [
        { masteryLevel: 'asc' },
        { nextReviewAt: 'asc' },
      ],
      take,
      select: {
        masteryLevel: true,
        memoryStrength: true,
        nextReviewAt: true,
        incorrectCount: true,
        lapseCount: true,
        reviewCount: true,
        kanji: {
          select: {
            id: true,
            character: true,
            meaningsVi: true,
            meaningsEn: true,
            onyomi: true,
            kunyomi: true,
            jlptLevel: true,
            strokeCount: true,
            radical: true,
            words: {
              take: 4,
              select: {
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
            },
          },
        },
      },
    });
  },

  findNewKanji(userId: string, take: number) {
    return prisma.kanji.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        userStates: {
          none: { userId },
        },
      },
      orderBy: [
        { jlptLevel: 'asc' },
        { frequency: 'asc' },
        { character: 'asc' },
      ],
      take,
      select: {
        id: true,
        character: true,
        meaningsVi: true,
        meaningsEn: true,
        onyomi: true,
        kunyomi: true,
        jlptLevel: true,
        strokeCount: true,
        radical: true,
        words: {
          take: 4,
          select: {
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
        },
      },
    });
  },
};

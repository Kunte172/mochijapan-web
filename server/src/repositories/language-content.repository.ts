import {
  ContentStatus,
  type JlptLevel,
} from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

export const languageContentRepository = {
  async listGrammar(args: {
    query?: string;
    jlpt?: JlptLevel;
    page: number;
    pageSize: number;
  }) {
    const where = {
      status: ContentStatus.PUBLISHED,
      ...(args.jlpt ? { jlptLevel: args.jlpt } : {}),
      ...(args.query
        ? {
            OR: [
              {
                pattern: {
                  contains: args.query,
                  mode: 'insensitive' as const,
                },
              },
              {
                meaningVi: {
                  contains: args.query,
                  mode: 'insensitive' as const,
                },
              },
              {
                meaningEn: {
                  contains: args.query,
                  mode: 'insensitive' as const,
                },
              },
              {
                tags: {
                  has: args.query,
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.grammarPoint.findMany({
        where,
        orderBy: [
          { jlptLevel: 'asc' },
          { code: 'asc' },
        ],
        skip: (args.page - 1) * args.pageSize,
        take: args.pageSize,
        select: {
          id: true,
          code: true,
          pattern: true,
          meaningVi: true,
          meaningEn: true,
          explanationVi: true,
          explanationEn: true,
          formation: true,
          jlptLevel: true,
          tags: true,
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
      }),
      prisma.grammarPoint.count({ where }),
    ]);

    return { items, total };
  },

  findGrammarById(id: string) {
    return prisma.grammarPoint.findFirst({
      where: {
        id,
        status: ContentStatus.PUBLISHED,
      },
      select: {
        id: true,
        code: true,
        pattern: true,
        meaningVi: true,
        meaningEn: true,
        explanationVi: true,
        explanationEn: true,
        formation: true,
        jlptLevel: true,
        tags: true,
        examples: {
          orderBy: { sortOrder: 'asc' },
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

  async listKanji(args: {
    query?: string;
    jlpt?: JlptLevel;
    page: number;
    pageSize: number;
  }) {
    const where = {
      status: ContentStatus.PUBLISHED,
      ...(args.jlpt ? { jlptLevel: args.jlpt } : {}),
      ...(args.query
        ? {
            OR: [
              {
                character: {
                  contains: args.query,
                },
              },
              {
                meaningsVi: {
                  has: args.query,
                },
              },
              {
                meaningsEn: {
                  has: args.query,
                },
              },
              {
                onyomi: {
                  has: args.query,
                },
              },
              {
                kunyomi: {
                  has: args.query,
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.kanji.findMany({
        where,
        orderBy: [
          { jlptLevel: 'asc' },
          { frequency: 'asc' },
          { character: 'asc' },
        ],
        skip: (args.page - 1) * args.pageSize,
        take: args.pageSize,
        select: {
          id: true,
          character: true,
          meaningsVi: true,
          meaningsEn: true,
          onyomi: true,
          kunyomi: true,
          jlptLevel: true,
          grade: true,
          strokeCount: true,
          radical: true,
          frequency: true,
          _count: {
            select: { words: true },
          },
        },
      }),
      prisma.kanji.count({ where }),
    ]);

    return { items, total };
  },

  findKanjiByCharacter(character: string) {
    return prisma.kanji.findFirst({
      where: {
        character,
        status: ContentStatus.PUBLISHED,
      },
      select: {
        id: true,
        character: true,
        meaningsVi: true,
        meaningsEn: true,
        onyomi: true,
        kunyomi: true,
        nanori: true,
        jlptLevel: true,
        grade: true,
        strokeCount: true,
        radical: true,
        frequency: true,
        words: {
          take: 30,
          select: {
            word: {
              select: {
                id: true,
                writtenForm: true,
                reading: true,
                romaji: true,
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

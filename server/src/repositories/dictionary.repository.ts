import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

const dictionaryWordSelect = {
  id: true,
  sourceWordId: true,
  code: true,
  writtenForm: true,
  reading: true,
  romaji: true,
  meaningVi: true,
  meaningEn: true,
  partOfSpeech: true,
  searchForms: true,
  otherForm: true,
  audioUrl: true,
  pictureUrl: true,
  examples: {
    take: 3,
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
} satisfies Prisma.WordSelect;

const dictionaryWordDetailSelect = {
  ...dictionaryWordSelect,
  lessonWords: {
    take: 10,
    orderBy: {
      position: 'asc',
    },
    select: {
      position: true,
      lesson: {
        select: {
          id: true,
          title: true,
          titleEn: true,
          course: {
            select: {
              id: true,
              title: true,
              titleEn: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.WordSelect;

export type DictionaryWordRecord = Prisma.WordGetPayload<{
  select: typeof dictionaryWordSelect;
}>;

export const dictionaryRepository = {
  search(query: string, take: number): Promise<DictionaryWordRecord[]> {
    return prisma.word.findMany({
      where: {
        OR: [
          {
            writtenForm: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            reading: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            romaji: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            meaningVi: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            meaningEn: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            otherForm: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            searchForms: {
              has: query,
            },
          },
        ],
      },
      take,
      orderBy: [
        {
          sourceWordId: 'asc',
        },
        {
          reading: 'asc',
        },
      ],
      select: dictionaryWordSelect,
    });
  },

  findById(id: string) {
    return prisma.word.findUnique({
      where: {
        id,
      },
      select: dictionaryWordDetailSelect,
    });
  },
};

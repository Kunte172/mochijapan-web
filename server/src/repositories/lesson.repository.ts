import { ContentStatus, Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

const lessonDetailSelect = {
  id: true,
  sourceLessonId: true,
  code: true,
  title: true,
  titleEn: true,
  description: true,
  descriptionEn: true,
  imageUrl: true,
  sortOrder: true,
  course: {
    select: {
      id: true,
      code: true,
      title: true,
      titleEn: true,
    },
  },
  lessonWords: {
    orderBy: {
      position: 'asc',
    },
    select: {
      position: true,
      word: {
        select: {
          id: true,
          sourceWordId: true,
          code: true,
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
} satisfies Prisma.LessonSelect;

export type LessonDetailRecord = Prisma.LessonGetPayload<{
  select: typeof lessonDetailSelect;
}>;

export const lessonRepository = {
  findPublishedLessonById(id: string): Promise<LessonDetailRecord | null> {
    return prisma.lesson.findFirst({
      where: {
        id,
        status: ContentStatus.PUBLISHED,
        course: {
          status: ContentStatus.PUBLISHED,
        },
      },
      select: lessonDetailSelect,
    });
  },
};

import { ContentStatus, Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

const courseListSelect = {
  id: true,
  sourceCourseId: true,
  code: true,
  title: true,
  titleEn: true,
  description: true,
  descriptionEn: true,
  imageUrl: true,
  level: true,
  sortOrder: true,
  _count: {
    select: {
      lessons: {
        where: {
          status: ContentStatus.PUBLISHED,
        },
      },
    },
  },
} satisfies Prisma.CourseSelect;

const courseDetailSelect = {
  id: true,
  sourceCourseId: true,
  code: true,
  title: true,
  titleEn: true,
  description: true,
  descriptionEn: true,
  imageUrl: true,
  level: true,
  sortOrder: true,
  lessons: {
    where: {
      status: ContentStatus.PUBLISHED,
    },
    orderBy: {
      sortOrder: 'asc',
    },
    select: {
      id: true,
      sourceLessonId: true,
      code: true,
      title: true,
      titleEn: true,
      description: true,
      descriptionEn: true,
      imageUrl: true,
      sortOrder: true,
      _count: {
        select: {
          lessonWords: true,
        },
      },
    },
  },
} satisfies Prisma.CourseSelect;

export type CourseListRecord = Prisma.CourseGetPayload<{
  select: typeof courseListSelect;
}>;

export type CourseDetailRecord = Prisma.CourseGetPayload<{
  select: typeof courseDetailSelect;
}>;

export const courseRepository = {
  findPublishedCourses(): Promise<CourseListRecord[]> {
    return prisma.course.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
      },
      orderBy: [
        {
          sortOrder: 'asc',
        },
        {
          sourceCourseId: 'asc',
        },
      ],
      select: courseListSelect,
    });
  },

  findPublishedCourseById(id: string): Promise<CourseDetailRecord | null> {
    return prisma.course.findFirst({
      where: {
        id,
        status: ContentStatus.PUBLISHED,
      },
      select: courseDetailSelect,
    });
  },
};
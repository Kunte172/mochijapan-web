export type CourseSummary = {
  id: string;
  sourceCourseId: number | null;
  code: string | null;
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  level: string | null;
  sortOrder: number;
  lessonCount: number;
};

export type LessonSummary = {
  id: string;
  sourceLessonId: number | null;
  code: string | null;
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  sortOrder: number;
  wordCount: number;
};

export type CourseDetail = CourseSummary & {
  lessons: LessonSummary[];
};

export type ApiResponse<T> = {
  status: 'ok';
  data: T;
};

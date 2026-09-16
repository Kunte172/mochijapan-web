import {
  courseRepository,
  type CourseDetailRecord,
  type CourseListRecord,
} from '../repositories/course.repository.js';

function mapCourseListItem(course: CourseListRecord) {
  return {
    id: course.id,
    sourceCourseId: course.sourceCourseId,
    code: course.code,
    title: course.title,
    titleEn: course.titleEn,
    description: course.description,
    descriptionEn: course.descriptionEn,
    imageUrl: course.imageUrl,
    level: course.level,
    sortOrder: course.sortOrder,
    lessonCount: course._count.lessons,
  };
}

function mapCourseDetail(course: CourseDetailRecord) {
  return {
    id: course.id,
    sourceCourseId: course.sourceCourseId,
    code: course.code,
    title: course.title,
    titleEn: course.titleEn,
    description: course.description,
    descriptionEn: course.descriptionEn,
    imageUrl: course.imageUrl,
    level: course.level,
    sortOrder: course.sortOrder,
    lessonCount: course.lessons.length,
    lessons: course.lessons.map((lesson) => ({
      id: lesson.id,
      sourceLessonId: lesson.sourceLessonId,
      code: lesson.code,
      title: lesson.title,
      titleEn: lesson.titleEn,
      description: lesson.description,
      descriptionEn: lesson.descriptionEn,
      imageUrl: lesson.imageUrl,
      sortOrder: lesson.sortOrder,
      wordCount: lesson._count.lessonWords,
    })),
  };
}

export async function getPublishedCourses() {
  const courses = await courseRepository.findPublishedCourses();

  return courses.map(mapCourseListItem);
}

export async function getPublishedCourse(id: string) {
  const course = await courseRepository.findPublishedCourseById(id);

  if (!course) {
    return null;
  }

  return mapCourseDetail(course);
}
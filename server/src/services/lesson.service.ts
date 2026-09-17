import {
  lessonRepository,
  type LessonDetailRecord,
} from '../repositories/lesson.repository.js';

function mapLessonDetail(lesson: LessonDetailRecord) {
  return {
    id: lesson.id,
    sourceLessonId: lesson.sourceLessonId,
    code: lesson.code,
    title: lesson.title,
    titleEn: lesson.titleEn,
    description: lesson.description,
    descriptionEn: lesson.descriptionEn,
    imageUrl: lesson.imageUrl,
    sortOrder: lesson.sortOrder,
    course: lesson.course,
    wordCount: lesson.lessonWords.length,
    words: lesson.lessonWords.map((item, index) => ({
      position: item.position ?? index + 1,
      ...item.word,
      example: item.word.examples[0] ?? null,
    })),
  };
}

export async function getPublishedLesson(id: string) {
  const lesson = await lessonRepository.findPublishedLessonById(id);

  if (!lesson) {
    return null;
  }

  return mapLessonDetail(lesson);
}

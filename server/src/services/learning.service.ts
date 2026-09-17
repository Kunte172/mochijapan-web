import { LessonProgressStatus } from '../generated/prisma/client.js';
import { learningRepository } from '../repositories/learning.repository.js';
import { AppError } from '../utils/app-error.js';

async function getLessonOrThrow(lessonId: string) {
  const lesson = await learningRepository.findPublishedLessonSummary(lessonId);

  if (!lesson) {
    throw new AppError(404, 'LESSON_NOT_FOUND', 'Lesson not found.');
  }

  return lesson;
}

export async function getLessonProgress(
  userId: string,
  lessonId: string,
) {
  await getLessonOrThrow(lessonId);
  return learningRepository.findProgress(userId, lessonId);
}

export async function startLesson(
  userId: string,
  lessonId: string,
) {
  const lesson = await getLessonOrThrow(lessonId);
  const result = await learningRepository.startLesson(
    userId,
    lessonId,
    lesson._count.lessonWords,
  );

  return {
    lesson: {
      id: lesson.id,
      title: lesson.title,
      wordCount: lesson._count.lessonWords,
    },
    progress: result.progress,
    session: result.session,
  };
}

export async function updateLessonProgress(
  userId: string,
  lessonId: string,
  currentPosition: number,
) {
  const lesson = await getLessonOrThrow(lessonId);
  const progress = await learningRepository.findProgress(userId, lessonId);

  if (!progress) {
    throw new AppError(
      409,
      'LESSON_NOT_STARTED',
      'Start the lesson before updating progress.',
    );
  }

  if (progress.status === LessonProgressStatus.COMPLETED) {
    return progress;
  }

  const safePosition = Math.min(
    currentPosition,
    lesson._count.lessonWords,
  );

  const monotonicPosition = Math.max(
    progress.currentPosition,
    safePosition,
  );

  return learningRepository.updateProgress(
    progress.id,
    monotonicPosition,
  );
}

export async function completeLesson(
  userId: string,
  lessonId: string,
  sessionId?: string,
) {
  const lesson = await getLessonOrThrow(lessonId);

  return learningRepository.completeLesson({
    userId,
    lessonId,
    sessionId,
    wordIds: lesson.lessonWords.map((item) => item.wordId),
  });
}

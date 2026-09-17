import type { NextFunction, Request, Response } from 'express';
import { getPublishedLesson } from '../services/lesson.service.js';

export async function getPublishedLessonById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rawLessonId = req.params.lessonId;
    const lessonId = Array.isArray(rawLessonId) ? rawLessonId[0] : rawLessonId;

    if (!lessonId) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_LESSON_ID',
        message: 'Lesson id is invalid',
      });
      return;
    }

    const lesson = await getPublishedLesson(lessonId);

    if (!lesson) {
      res.status(404).json({
        status: 'error',
        code: 'LESSON_NOT_FOUND',
        message: 'Lesson not found',
      });
      return;
    }

    res.status(200).json({
      status: 'ok',
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
}

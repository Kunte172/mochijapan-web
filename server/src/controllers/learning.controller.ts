import type { NextFunction, Request, Response } from 'express';
import {
  completeLesson,
  getLessonProgress,
  startLesson,
  updateLessonProgress,
} from '../services/learning.service.js';
import {
  completeLessonSchema,
  updateLessonProgressSchema,
} from '../schemas/learning.schema.js';

function getLessonId(req: Request) {
  const rawLessonId = req.params.lessonId;
  return Array.isArray(rawLessonId) ? rawLessonId[0] : rawLessonId;
}

function getUserId(req: Request) {
  if (!req.auth?.userId) {
    throw new Error('Authenticated user is missing from request.');
  }

  return req.auth.userId;
}

export async function getMyLessonProgress(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const lessonId = getLessonId(req);
    const userId = getUserId(req);

    if (!lessonId) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_LESSON_ID',
        message: 'Lesson id is invalid',
      });
      return;
    }

    const progress = await getLessonProgress(userId, lessonId);

    res.status(200).json({
      status: 'ok',
      data: progress,
    });
  } catch (error) {
    next(error);
  }
}

export async function startMyLesson(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const lessonId = getLessonId(req);
    const userId = getUserId(req);

    if (!lessonId) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_LESSON_ID',
        message: 'Lesson id is invalid',
      });
      return;
    }

    const result = await startLesson(userId, lessonId);

    res.status(201).json({
      status: 'ok',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMyLessonProgress(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const lessonId = getLessonId(req);
    const userId = getUserId(req);

    if (!lessonId) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_LESSON_ID',
        message: 'Lesson id is invalid',
      });
      return;
    }

    const parsed = updateLessonProgressSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_PROGRESS',
        message: 'Current position is invalid',
      });
      return;
    }

    const progress = await updateLessonProgress(
      userId,
      lessonId,
      parsed.data.currentPosition,
    );

    res.status(200).json({
      status: 'ok',
      data: progress,
    });
  } catch (error) {
    next(error);
  }
}

export async function completeMyLesson(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const lessonId = getLessonId(req);
    const userId = getUserId(req);

    if (!lessonId) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_LESSON_ID',
        message: 'Lesson id is invalid',
      });
      return;
    }

    const parsed = completeLessonSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_COMPLETION_REQUEST',
        message: 'Completion request is invalid',
      });
      return;
    }

    const progress = await completeLesson(
      userId,
      lessonId,
      parsed.data.sessionId,
    );

    res.status(200).json({
      status: 'ok',
      data: progress,
    });
  } catch (error) {
    next(error);
  }
}

import type { NextFunction, Request, Response } from 'express';
import {
  answerQuizSchema,
  startQuizSchema,
} from '../schemas/quiz.schema.js';
import {
  getActiveQuiz,
  getQuizAttempt,
  startQuiz,
  submitQuizAnswer,
} from '../services/quiz.service.js';

function userIdFrom(req: Request) {
  if (!req.auth?.userId) {
    throw new Error('Authenticated user is missing from request.');
  }

  return req.auth.userId;
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getMyActiveQuiz(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const lessonId = singleParam(req.params.lessonId);

    if (!lessonId) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_LESSON_ID',
        message: 'Lesson id is invalid.',
      });
      return;
    }

    const attempt = await getActiveQuiz(
      userIdFrom(req),
      lessonId,
    );

    res.status(200).json({
      status: 'ok',
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
}

export async function startMyQuiz(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const lessonId = singleParam(req.params.lessonId);

    if (!lessonId) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_LESSON_ID',
        message: 'Lesson id is invalid.',
      });
      return;
    }

    const parsed = startQuizSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_QUIZ_ANSWER',
        message: 'Quiz answer is invalid.',
        issues: parsed.error.issues,
        received: req.body,
      });

      return;
    }

    const result = await startQuiz(
      userIdFrom(req),
      lessonId,
      parsed.data.limit,
    );

    res.status(result.reused ? 200 : 201).json({
      status: 'ok',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyQuizAttempt(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const attemptId = singleParam(req.params.attemptId);

    if (!attemptId) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_QUIZ_ATTEMPT_ID',
        message: 'Quiz attempt id is invalid.',
      });
      return;
    }

    const attempt = await getQuizAttempt(
      userIdFrom(req),
      attemptId,
    );

    res.status(200).json({
      status: 'ok',
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
}

export async function answerMyQuiz(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const attemptId = singleParam(req.params.attemptId);

    if (!attemptId) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_QUIZ_ATTEMPT_ID',
        message: 'Quiz attempt id is invalid.',
      });
      return;
    }

    const parsed = answerQuizSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_QUIZ_ANSWER',
        message: 'Quiz answer is invalid.',
      });
      return;
    }

    const result = await submitQuizAnswer({
      userId: userIdFrom(req),
      attemptId,
      ...parsed.data,
    });

    res.status(200).json({
      status: 'ok',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

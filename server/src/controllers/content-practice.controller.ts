import type { NextFunction, Request, Response } from 'express';
import { ReviewRating } from '../generated/prisma/client.js';
import {
  practiceQueueQuerySchema,
  rateContentSchema,
} from '../schemas/content-practice.schema.js';
import {
  getContentPracticeSummary,
  getGrammarPracticeQueue,
  getKanjiPracticeQueue,
  rateGrammar,
  rateKanji,
} from '../services/content-practice.service.js';

function userIdFrom(req: Request) {
  if (!req.auth?.userId) {
    throw new Error('Authenticated user is missing from request.');
  }

  return req.auth.userId;
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getPracticeSummary(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getContentPracticeSummary(userIdFrom(req));
    res.status(200).json({ status: 'ok', data });
  } catch (error) {
    next(error);
  }
}

export async function getGrammarQueue(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = practiceQueueQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_PRACTICE_QUERY',
        message: 'Practice queue query is invalid.',
      });
      return;
    }

    const data = await getGrammarPracticeQueue(
      userIdFrom(req),
      parsed.data.limit,
    );

    res.status(200).json({ status: 'ok', data });
  } catch (error) {
    next(error);
  }
}

export async function getKanjiQueue(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = practiceQueueQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_PRACTICE_QUERY',
        message: 'Practice queue query is invalid.',
      });
      return;
    }

    const data = await getKanjiPracticeQueue(
      userIdFrom(req),
      parsed.data.limit,
    );

    res.status(200).json({ status: 'ok', data });
  } catch (error) {
    next(error);
  }
}

export async function rateGrammarItem(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const grammarId = singleParam(req.params.grammarId);
    const parsed = rateContentSchema.safeParse(req.body);

    if (!grammarId || !parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_GRAMMAR_REVIEW',
        message: 'Grammar review request is invalid.',
      });
      return;
    }

    const data = await rateGrammar({
      userId: userIdFrom(req),
      grammarId,
      rating: parsed.data.rating as ReviewRating,
      responseTimeMs: parsed.data.responseTimeMs,
      idempotencyKey: parsed.data.idempotencyKey,
    });

    res.status(200).json({ status: 'ok', data });
  } catch (error) {
    next(error);
  }
}

export async function rateKanjiItem(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const kanjiId = singleParam(req.params.kanjiId);
    const parsed = rateContentSchema.safeParse(req.body);

    if (!kanjiId || !parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_KANJI_REVIEW',
        message: 'Kanji review request is invalid.',
      });
      return;
    }

    const data = await rateKanji({
      userId: userIdFrom(req),
      kanjiId,
      rating: parsed.data.rating as ReviewRating,
      responseTimeMs: parsed.data.responseTimeMs,
      idempotencyKey: parsed.data.idempotencyKey,
    });

    res.status(200).json({ status: 'ok', data });
  } catch (error) {
    next(error);
  }
}

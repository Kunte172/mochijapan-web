import type { NextFunction, Request, Response } from 'express';
import {
  grammarListQuerySchema,
  kanjiListQuerySchema,
} from '../schemas/language-content.schema.js';
import {
  getGrammar,
  getKanji,
  listGrammar,
  listKanji,
} from '../services/language-content.service.js';

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function listPublishedGrammar(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = grammarListQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_GRAMMAR_QUERY',
        message: 'Grammar query is invalid.',
      });
      return;
    }

    const data = await listGrammar({
      query: parsed.data.q || undefined,
      jlpt: parsed.data.jlpt,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    });

    res.status(200).json({ status: 'ok', data });
  } catch (error) {
    next(error);
  }
}

export async function getPublishedGrammar(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const grammarId = singleParam(req.params.grammarId);

    if (!grammarId) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_GRAMMAR_ID',
        message: 'Grammar id is invalid.',
      });
      return;
    }

    const data = await getGrammar(grammarId);
    res.status(200).json({ status: 'ok', data });
  } catch (error) {
    next(error);
  }
}

export async function listPublishedKanji(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = kanjiListQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_KANJI_QUERY',
        message: 'Kanji query is invalid.',
      });
      return;
    }

    const data = await listKanji({
      query: parsed.data.q || undefined,
      jlpt: parsed.data.jlpt,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    });

    res.status(200).json({ status: 'ok', data });
  } catch (error) {
    next(error);
  }
}

export async function getPublishedKanji(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const character = singleParam(req.params.character);

    if (!character) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_KANJI_CHARACTER',
        message: 'Kanji character is invalid.',
      });
      return;
    }

    const data = await getKanji(decodeURIComponent(character));
    res.status(200).json({ status: 'ok', data });
  } catch (error) {
    next(error);
  }
}

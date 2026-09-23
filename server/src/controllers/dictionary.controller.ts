import type { NextFunction, Request, Response } from 'express';
import { dictionarySearchSchema } from '../schemas/dictionary.schema.js';
import {
  getDictionaryWord,
  searchDictionary,
} from '../services/dictionary.service.js';

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function searchDictionaryWords(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = dictionarySearchSchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_DICTIONARY_QUERY',
        message: 'Dictionary search query is invalid.',
      });
      return;
    }

    const words = await searchDictionary(
      parsed.data.q,
      parsed.data.limit,
    );

    res.status(200).json({
      status: 'ok',
      data: {
        query: parsed.data.q,
        count: words.length,
        words,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDictionaryWordById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const wordId = singleParam(req.params.wordId);

    if (!wordId) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_WORD_ID',
        message: 'Word id is invalid.',
      });
      return;
    }

    const word = await getDictionaryWord(wordId);

    res.status(200).json({
      status: 'ok',
      data: word,
    });
  } catch (error) {
    next(error);
  }
}

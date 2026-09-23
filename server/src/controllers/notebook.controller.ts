import type { NextFunction, Request, Response } from 'express';
import {
  notebookListSchema,
  saveWordSchema,
  updateSavedWordSchema,
} from '../schemas/notebook.schema.js';
import {
  getNotebookSummary,
  listNotebookWords,
  removeNotebookWord,
  saveNotebookWord,
  updateNotebookWordNote,
} from '../services/notebook.service.js';

function userIdFrom(req: Request) {
  if (!req.auth?.userId) {
    throw new Error('Authenticated user is missing from request.');
  }

  return req.auth.userId;
}

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function listMyNotebook(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = notebookListSchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_NOTEBOOK_QUERY',
        message: 'Notebook query is invalid.',
      });
      return;
    }

    const data = await listNotebookWords({
      userId: userIdFrom(req),
      query: parsed.data.q,
      source: parsed.data.source,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    });

    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyNotebookSummary(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getNotebookSummary(userIdFrom(req));

    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function saveWordToMyNotebook(
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

    const parsed = saveWordSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_SAVED_WORD',
        message: 'Saved word request is invalid.',
      });
      return;
    }

    const data = await saveNotebookWord({
      userId: userIdFrom(req),
      wordId,
      source: parsed.data.source,
      note: parsed.data.note,
    });

    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateWordInMyNotebook(
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

    const parsed = updateSavedWordSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        status: 'error',
        code: 'INVALID_SAVED_WORD_UPDATE',
        message: 'Saved word update is invalid.',
      });
      return;
    }

    const data = await updateNotebookWordNote({
      userId: userIdFrom(req),
      wordId,
      note: parsed.data.note,
    });

    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeWordFromMyNotebook(
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

    await removeNotebookWord(userIdFrom(req), wordId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

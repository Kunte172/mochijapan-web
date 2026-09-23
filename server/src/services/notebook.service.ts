import type { SavedWordSource } from '../generated/prisma/client.js';
import { notebookRepository } from '../repositories/notebook.repository.js';
import { AppError } from '../utils/app-error.js';

function mapSavedWord<T extends {
  word: {
    userStates: Array<{
      masteryLevel: number;
      memoryStrength: number;
      lastReviewedAt: Date | null;
      nextReviewAt: Date | null;
      correctCount: number;
      incorrectCount: number;
      lapseCount: number;
      reviewCount: number;
      streak: number;
    }>;
  };
}>(saved: T) {
  const state = saved.word.userStates[0] ?? null;

  return {
    ...saved,
    word: {
      ...saved.word,
      userStates: undefined,
    },
    learningState: state,
    isDue: Boolean(
      state?.nextReviewAt &&
      state.nextReviewAt.getTime() <= Date.now(),
    ),
  };
}

export async function saveNotebookWord(args: {
  userId: string;
  wordId: string;
  source: SavedWordSource;
  note?: string;
}) {
  const word = await notebookRepository.findWord(args.wordId);

  if (!word) {
    throw new AppError(
      404,
      'WORD_NOT_FOUND',
      'Word was not found.',
    );
  }

  const saved = await notebookRepository.saveWord(args);
  return mapSavedWord(saved);
}

export async function updateNotebookWordNote(args: {
  userId: string;
  wordId: string;
  note: string | null;
}) {
  const existing = await notebookRepository.findSavedWord(
    args.userId,
    args.wordId,
  );

  if (!existing) {
    throw new AppError(
      404,
      'SAVED_WORD_NOT_FOUND',
      'Saved word was not found.',
    );
  }

  const saved = await notebookRepository.updateNote(
    args.userId,
    args.wordId,
    args.note,
  );

  return mapSavedWord(saved);
}

export async function removeNotebookWord(
  userId: string,
  wordId: string,
) {
  await notebookRepository.deleteWord(userId, wordId);
}

export async function listNotebookWords(args: {
  userId: string;
  query?: string;
  source?: SavedWordSource;
  page: number;
  pageSize: number;
}) {
  const result = await notebookRepository.list(args);

  return {
    items: result.items.map(mapSavedWord),
    pagination: {
      page: args.page,
      pageSize: args.pageSize,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / args.pageSize)),
    },
  };
}

export async function getNotebookSummary(userId: string) {
  const summary = await notebookRepository.summary(userId, new Date());

  return {
    total: summary.total,
    dueNow: summary.dueNow,
    bySource: Object.fromEntries(
      summary.sources.map((item) => [item.source, item._count._all]),
    ),
  };
}

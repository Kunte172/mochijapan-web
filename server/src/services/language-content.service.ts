import type { JlptLevel } from '../generated/prisma/client.js';
import { languageContentRepository } from '../repositories/language-content.repository.js';
import { AppError } from '../utils/app-error.js';

function pagination(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function listGrammar(args: {
  query?: string;
  jlpt?: JlptLevel;
  page: number;
  pageSize: number;
}) {
  const result = await languageContentRepository.listGrammar(args);

  return {
    items: result.items,
    pagination: pagination(args.page, args.pageSize, result.total),
  };
}

export async function getGrammar(id: string) {
  const item = await languageContentRepository.findGrammarById(id);

  if (!item) {
    throw new AppError(
      404,
      'GRAMMAR_NOT_FOUND',
      'Grammar point was not found.',
    );
  }

  return item;
}

export async function listKanji(args: {
  query?: string;
  jlpt?: JlptLevel;
  page: number;
  pageSize: number;
}) {
  const result = await languageContentRepository.listKanji(args);

  return {
    items: result.items.map((item) => ({
      ...item,
      wordCount: item._count.words,
      _count: undefined,
    })),
    pagination: pagination(args.page, args.pageSize, result.total),
  };
}

export async function getKanji(character: string) {
  const item = await languageContentRepository.findKanjiByCharacter(character);

  if (!item) {
    throw new AppError(
      404,
      'KANJI_NOT_FOUND',
      'Kanji was not found.',
    );
  }

  return {
    ...item,
    words: item.words.map((link) => link.word),
  };
}

import {
  dictionaryRepository,
  type DictionaryWordRecord,
} from '../repositories/dictionary.repository.js';
import { AppError } from '../utils/app-error.js';

function normalize(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase() ?? '';
}

function rankWord(word: DictionaryWordRecord, query: string) {
  const normalizedQuery = normalize(query);
  const primaryForms = [
    word.writtenForm,
    word.reading,
    word.romaji,
    word.otherForm,
  ].map(normalize);

  if (primaryForms.includes(normalizedQuery)) {
    return 0;
  }

  if (primaryForms.some((value) => value.startsWith(normalizedQuery))) {
    return 1;
  }

  if (primaryForms.some((value) => value.includes(normalizedQuery))) {
    return 2;
  }

  if (word.searchForms.some((value) => normalize(value) === normalizedQuery)) {
    return 2;
  }

  if (normalize(word.meaningVi).startsWith(normalizedQuery)) {
    return 3;
  }

  if (normalize(word.meaningEn).startsWith(normalizedQuery)) {
    return 3;
  }

  return 4;
}

export async function searchDictionary(query: string, limit: number) {
  const candidates = await dictionaryRepository.search(
    query,
    Math.min(limit * 3, 60),
  );

  return candidates
    .map((word) => ({
      word,
      rank: rankWord(word, query),
    }))
    .sort((left, right) => {
      if (left.rank !== right.rank) {
        return left.rank - right.rank;
      }

      return (left.word.sourceWordId ?? Number.MAX_SAFE_INTEGER) -
        (right.word.sourceWordId ?? Number.MAX_SAFE_INTEGER);
    })
    .slice(0, limit)
    .map(({ word }) => word);
}

export async function getDictionaryWord(id: string) {
  const word = await dictionaryRepository.findById(id);

  if (!word) {
    throw new AppError(
      404,
      'WORD_NOT_FOUND',
      'Dictionary word was not found.',
    );
  }

  return word;
}

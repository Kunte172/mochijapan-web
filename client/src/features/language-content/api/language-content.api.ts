import { apiGet } from '../../../lib/api';
import type {
  GrammarDetailResponse,
  GrammarListResponse,
  JlptLevel,
  KanjiDetailResponse,
  KanjiListResponse,
} from '../types';

export function getGrammarList(args: {
  query?: string;
  jlpt?: JlptLevel;
  page?: number;
  pageSize?: number;
}) {
  const params = new URLSearchParams();

  if (args.query) params.set('q', args.query);
  if (args.jlpt) params.set('jlpt', args.jlpt);
  params.set('page', String(args.page ?? 1));
  params.set('pageSize', String(args.pageSize ?? 20));

  return apiGet<GrammarListResponse>(
    `/content/grammar?${params.toString()}`,
  ).then((response) => response.data);
}

export function getGrammarPoint(grammarId: string) {
  return apiGet<GrammarDetailResponse>(
    `/content/grammar/${grammarId}`,
  ).then((response) => response.data);
}

export function getKanjiList(args: {
  query?: string;
  jlpt?: JlptLevel;
  page?: number;
  pageSize?: number;
}) {
  const params = new URLSearchParams();

  if (args.query) params.set('q', args.query);
  if (args.jlpt) params.set('jlpt', args.jlpt);
  params.set('page', String(args.page ?? 1));
  params.set('pageSize', String(args.pageSize ?? 40));

  return apiGet<KanjiListResponse>(
    `/content/kanji?${params.toString()}`,
  ).then((response) => response.data);
}

export function getKanjiDetail(character: string) {
  return apiGet<KanjiDetailResponse>(
    `/content/kanji/${encodeURIComponent(character)}`,
  ).then((response) => response.data);
}

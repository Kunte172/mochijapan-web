import { apiAuthRequest } from '../../../lib/api';
import type {
  GrammarPracticeItem,
  KanjiPracticeItem,
  PracticeQueue,
  PracticeSummary,
  ReviewRating,
} from '../types';

type OkResponse<T> = {
  status: 'ok';
  data: T;
};

export function getPracticeSummary() {
  return apiAuthRequest<OkResponse<PracticeSummary>>(
    '/practice/summary',
  ).then((response) => response.data);
}

export function getGrammarPracticeQueue(limit = 10) {
  return apiAuthRequest<OkResponse<PracticeQueue<GrammarPracticeItem>>>(
    `/practice/grammar/queue?limit=${limit}`,
  ).then((response) => response.data);
}

export function getKanjiPracticeQueue(limit = 10) {
  return apiAuthRequest<OkResponse<PracticeQueue<KanjiPracticeItem>>>(
    `/practice/kanji/queue?limit=${limit}`,
  ).then((response) => response.data);
}

export function rateGrammar(args: {
  grammarId: string;
  rating: ReviewRating;
  responseTimeMs: number;
  idempotencyKey: string;
}) {
  return apiAuthRequest<OkResponse<unknown>>(
    `/practice/grammar/${args.grammarId}/rate`,
    {
      method: 'POST',
      body: JSON.stringify({
        rating: args.rating,
        responseTimeMs: args.responseTimeMs,
        idempotencyKey: args.idempotencyKey,
      }),
    },
  ).then((response) => response.data);
}

export function rateKanji(args: {
  kanjiId: string;
  rating: ReviewRating;
  responseTimeMs: number;
  idempotencyKey: string;
}) {
  return apiAuthRequest<OkResponse<unknown>>(
    `/practice/kanji/${args.kanjiId}/rate`,
    {
      method: 'POST',
      body: JSON.stringify({
        rating: args.rating,
        responseTimeMs: args.responseTimeMs,
        idempotencyKey: args.idempotencyKey,
      }),
    },
  ).then((response) => response.data);
}

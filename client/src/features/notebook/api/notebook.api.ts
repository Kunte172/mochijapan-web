import { apiAuthRequest } from '../../../lib/api';
import type {
  NotebookListResponse,
  NotebookSummaryResponse,
  NotebookWord,
  SavedWordSource,
} from '../types';

type SavedWordResponse = {
  status: 'ok';
  data: NotebookWord;
};

export function getNotebookWords(args: {
  query?: string;
  source?: SavedWordSource;
  page?: number;
  pageSize?: number;
}) {
  const params = new URLSearchParams();

  if (args.query) {
    params.set('q', args.query);
  }

  if (args.source) {
    params.set('source', args.source);
  }

  params.set('page', String(args.page ?? 1));
  params.set('pageSize', String(args.pageSize ?? 20));

  return apiAuthRequest<NotebookListResponse>(
    `/notebook?${params.toString()}`,
  ).then((response) => response.data);
}

export function getNotebookSummary() {
  return apiAuthRequest<NotebookSummaryResponse>(
    '/notebook/summary',
  ).then((response) => response.data);
}

export function saveNotebookWord(
  wordId: string,
  source: SavedWordSource,
) {
  return apiAuthRequest<SavedWordResponse>(
    `/notebook/words/${wordId}`,
    {
      method: 'POST',
      body: JSON.stringify({ source }),
    },
  ).then((response) => response.data);
}

export function updateNotebookNote(
  wordId: string,
  note: string | null,
) {
  return apiAuthRequest<SavedWordResponse>(
    `/notebook/words/${wordId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    },
  ).then((response) => response.data);
}

export function removeNotebookWord(wordId: string) {
  return apiAuthRequest<null>(
    `/notebook/words/${wordId}`,
    {
      method: 'DELETE',
    },
  );
}

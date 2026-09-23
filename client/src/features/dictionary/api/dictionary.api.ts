import { apiGet } from '../../../lib/api';
import type { DictionarySearchResponse } from '../types';

export function searchDictionary(query: string, limit = 20) {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  return apiGet<DictionarySearchResponse>(
    `/dictionary/search?${params.toString()}`,
  ).then((response) => response.data);
}

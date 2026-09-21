import { apiAuthRequest } from '../../../lib/api';
import type {
  ReviewSessionResponse,
  ReviewSessionStartResponse,
  ReviewSummaryResponse,
} from '../types';

export function getReviewSummary() {
  return apiAuthRequest<ReviewSummaryResponse>(
    '/review/summary',
  ).then((response) => response.data);
}

export function getActiveReviewSession() {
  return apiAuthRequest<ReviewSessionResponse>(
    '/review/sessions/active',
  ).then((response) => response.data);
}

export function startReviewSession(limit = 20) {
  return apiAuthRequest<ReviewSessionStartResponse>(
    '/review/sessions/start',
    {
      method: 'POST',
      body: JSON.stringify({ limit }),
    },
  ).then((response) => response.data);
}

import { apiAuthRequest } from '../../../lib/api';
import type { LearningAnalyticsResponse } from '../types';

export function getLearningAnalytics(days = 14) {
  return apiAuthRequest<LearningAnalyticsResponse>(
    `/analytics/learning?days=${days}`,
  ).then((response) => response.data);
}

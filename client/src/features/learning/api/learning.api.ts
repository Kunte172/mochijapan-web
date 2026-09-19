import { apiAuthRequest } from '../../../lib/api';
import type { ProgressResponse, StartLessonResponse } from '../types';

export function getLessonProgress(lessonId: string) {
  return apiAuthRequest<ProgressResponse>(
    `/learning/lessons/${lessonId}/progress`,
  ).then((response) => response.data);
}

export function startLesson(lessonId: string) {
  return apiAuthRequest<StartLessonResponse>(
    `/learning/lessons/${lessonId}/start`,
    { method: 'POST' },
  ).then((response) => response.data);
}

export function updateLessonProgress(lessonId: string, currentPosition: number) {
  return apiAuthRequest<ProgressResponse>(
    `/learning/lessons/${lessonId}/progress`,
    {
      method: 'PATCH',
      body: JSON.stringify({ currentPosition }),
    },
  ).then((response) => response.data);
}

export function completeLesson(lessonId: string, sessionId: string) {
  return apiAuthRequest<ProgressResponse>(
    `/learning/lessons/${lessonId}/complete`,
    {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    },
  ).then((response) => response.data);
}

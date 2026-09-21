import { apiAuthRequest } from '../../../lib/api';
import type {
  AnswerResponse,
  ProgressResponse,
  ReviewRating,
  StartLessonResponse,
} from '../types';

export function getLessonProgress(lessonId: string) {
  return apiAuthRequest<ProgressResponse>(
    `/learning/lessons/${lessonId}/progress`,
  ).then((response) => response.data);
}

export function startLesson(lessonId: string) {
  return apiAuthRequest<StartLessonResponse>(
    `/learning/lessons/${lessonId}/start`,
    {
      method: 'POST',
    },
  ).then((response) => response.data);
}

export function updateLessonProgress(
  lessonId: string,
  currentPosition: number,
) {
  return apiAuthRequest<ProgressResponse>(
    `/learning/lessons/${lessonId}/progress`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        currentPosition,
      }),
    },
  ).then((response) => response.data);
}

export function completeLesson(
  lessonId: string,
  sessionId: string,
) {
  return apiAuthRequest<ProgressResponse>(
    `/learning/lessons/${lessonId}/complete`,
    {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
      }),
    },
  ).then((response) => response.data);
}

export function submitSessionAnswer(args: {
  sessionId: string;
  wordId: string;
  rating: ReviewRating;
  responseTimeMs: number;
  idempotencyKey: string;
  currentPosition: number;
}) {
  return apiAuthRequest<AnswerResponse>(
    `/learning/sessions/${args.sessionId}/answers`,
    {
      method: 'POST',
      body: JSON.stringify({
        wordId: args.wordId,
        rating: args.rating,
        responseTimeMs: args.responseTimeMs,
        idempotencyKey: args.idempotencyKey,
        currentPosition: args.currentPosition,
      }),
    },
  ).then((response) => response.data);
}

export const submitLearningAnswer = submitSessionAnswer;

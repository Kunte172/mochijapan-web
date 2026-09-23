import { apiAuthRequest } from '../../../lib/api';
import type {
  QuizAnswerResponse,
  QuizAttemptResponse,
  QuizStartResponse,
} from '../types';

export function startLessonQuiz(
  lessonId: string,
  limit = 10,
) {
  return apiAuthRequest<QuizStartResponse>(
    `/quizzes/lessons/${lessonId}/start`,
    {
      method: 'POST',
      body: JSON.stringify({ limit }),
    },
  ).then((response) => response.data);
}

export function getQuizAttempt(attemptId: string) {
  return apiAuthRequest<QuizAttemptResponse>(
    `/quizzes/attempts/${attemptId}`,
  ).then((response) => response.data);
}

export function submitQuizAnswer(args: {
  attemptId: string;
  itemId: string;
  selectedWordId: string;
  responseTimeMs: number;
  idempotencyKey: string;
}) {
  return apiAuthRequest<QuizAnswerResponse>(
    `/quizzes/attempts/${args.attemptId}/answers`,
    {
      method: 'POST',
      body: JSON.stringify({
        itemId: args.itemId,
        selectedWordId: args.selectedWordId,
        responseTimeMs: args.responseTimeMs,
        idempotencyKey: args.idempotencyKey,
      }),
    },
  ).then((response) => response.data);
}

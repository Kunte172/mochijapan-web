import { ReviewRating } from '../generated/prisma/client.js';
import { reviewRepository } from '../repositories/review.repository.js';

export function submitLearningAnswer(args: {
  userId: string;
  sessionId: string;
  wordId: string;
  rating: ReviewRating;
  responseTimeMs: number;
  idempotencyKey: string;
  currentPosition: number;
}) {
  return reviewRepository.submitAnswer(args);
}

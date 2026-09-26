import { ReviewRating } from '../generated/prisma/client.js';

type CurrentState = {
  masteryLevel: number;
  memoryStrength: number;
  correctCount: number;
  incorrectCount: number;
  lapseCount: number;
  reviewCount: number;
  streak: number;
  averageResponseTimeMs: number | null;
} | null;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function nextMastery(current: number, rating: ReviewRating) {
  if (rating === ReviewRating.AGAIN) {
    return Math.max(0, current - 1);
  }

  if (rating === ReviewRating.HARD) {
    return Math.max(1, current);
  }

  if (rating === ReviewRating.GOOD) {
    return Math.min(5, current + 1);
  }

  return Math.min(5, current + 2);
}

function nextMemory(current: number, rating: ReviewRating) {
  const factor = rating === ReviewRating.AGAIN
    ? 0.7
    : rating === ReviewRating.HARD
      ? 1.05
      : rating === ReviewRating.GOOD
        ? 1.35
        : 1.7;

  return Number(clamp(current * factor, 0.25, 100).toFixed(4));
}

function intervalMinutes(
  masteryLevel: number,
  rating: ReviewRating,
) {
  if (rating === ReviewRating.AGAIN) {
    return 10;
  }

  if (rating === ReviewRating.HARD) {
    return 8 * 60;
  }

  const goodDays = [1, 1, 2, 4, 8, 16];
  const easyDays = [1, 2, 4, 8, 16, 32];
  const days = rating === ReviewRating.EASY
    ? easyDays[masteryLevel]
    : goodDays[masteryLevel];

  return (days ?? 1) * 24 * 60;
}

export function applyContentRating(args: {
  current: CurrentState;
  rating: ReviewRating;
  responseTimeMs: number;
  now: Date;
}) {
  const current = args.current;
  const previousMasteryLevel = current?.masteryLevel ?? 0;
  const previousMemoryStrength = current?.memoryStrength ?? 1;
  const reviewCount = current?.reviewCount ?? 0;
  const isCorrect = args.rating !== ReviewRating.AGAIN;

  const masteryLevel = nextMastery(
    previousMasteryLevel,
    args.rating,
  );
  const memoryStrength = nextMemory(
    previousMemoryStrength,
    args.rating,
  );

  const previousAverage = current?.averageResponseTimeMs ?? 0;
  const averageResponseTimeMs = (
    (previousAverage * reviewCount) + args.responseTimeMs
  ) / (reviewCount + 1);

  const nextReviewAt = new Date(
    args.now.getTime() + (
      intervalMinutes(masteryLevel, args.rating) * 60_000
    ),
  );

  return {
    previousMasteryLevel,
    previousMemoryStrength,
    masteryLevel,
    memoryStrength,
    correctCount: (current?.correctCount ?? 0) + (isCorrect ? 1 : 0),
    incorrectCount: (current?.incorrectCount ?? 0) + (isCorrect ? 0 : 1),
    lapseCount: (current?.lapseCount ?? 0) + (
      args.rating === ReviewRating.AGAIN ? 1 : 0
    ),
    reviewCount: reviewCount + 1,
    streak: isCorrect ? (current?.streak ?? 0) + 1 : 0,
    averageResponseTimeMs,
    lastReviewedAt: args.now,
    nextReviewAt,
    isCorrect,
  };
}

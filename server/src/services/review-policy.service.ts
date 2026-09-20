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

const REVIEW_DELAY_MS: Record<number, number> = {
  0: 10 * 60 * 1000,
  1: 6 * 60 * 60 * 1000,
  2: 24 * 60 * 60 * 1000,
  3: 3 * 24 * 60 * 60 * 1000,
  4: 7 * 24 * 60 * 60 * 1000,
  5: 14 * 24 * 60 * 60 * 1000,
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function applyReviewRating(args: {
  current: CurrentState;
  rating: ReviewRating;
  responseTimeMs: number;
  now: Date;
}) {
  const current = args.current;
  const previousMasteryLevel = current?.masteryLevel ?? 0;
  const previousMemoryStrength = current?.memoryStrength ?? 1;
  const previousReviewCount = current?.reviewCount ?? 0;
  const previousAverage = current?.averageResponseTimeMs ?? null;

  let masteryLevel = previousMasteryLevel;
  let memoryStrength = previousMemoryStrength;
  let isCorrect = true;
  let streak = (current?.streak ?? 0) + 1;
  let lapseCount = current?.lapseCount ?? 0;

  if (args.rating === ReviewRating.AGAIN) {
    masteryLevel = Math.max(0, previousMasteryLevel - 1);
    memoryStrength = Math.max(0.5, previousMemoryStrength - 0.5);
    isCorrect = false;
    streak = 0;
    lapseCount += 1;
  }

  if (args.rating === ReviewRating.HARD) {
    masteryLevel = Math.max(1, previousMasteryLevel);
    memoryStrength = Math.min(10, previousMemoryStrength + 0.25);
  }

  if (args.rating === ReviewRating.GOOD) {
    masteryLevel = Math.min(5, previousMasteryLevel + 1);
    memoryStrength = Math.min(10, previousMemoryStrength + 0.75);
  }

  if (args.rating === ReviewRating.EASY) {
    masteryLevel = Math.min(5, previousMasteryLevel + 2);
    memoryStrength = Math.min(10, previousMemoryStrength + 1.5);
  }

  const reviewCount = previousReviewCount + 1;
  const averageResponseTimeMs = previousAverage === null
    ? args.responseTimeMs
    : ((previousAverage * previousReviewCount) + args.responseTimeMs) / reviewCount;
  const delay = REVIEW_DELAY_MS[masteryLevel] ?? REVIEW_DELAY_MS[5];

  return {
    isCorrect,
    previousMasteryLevel,
    previousMemoryStrength,
    masteryLevel,
    memoryStrength: round2(memoryStrength),
    correctCount: (current?.correctCount ?? 0) + (isCorrect ? 1 : 0),
    incorrectCount: (current?.incorrectCount ?? 0) + (isCorrect ? 0 : 1),
    lapseCount,
    reviewCount,
    streak,
    averageResponseTimeMs: round2(averageResponseTimeMs),
    lastReviewedAt: args.now,
    nextReviewAt: new Date(args.now.getTime() + delay),
  };
}

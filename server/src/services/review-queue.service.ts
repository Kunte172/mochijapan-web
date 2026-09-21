import { reviewQueueRepository } from '../repositories/review-queue.repository.js';
import { calculateReviewPriority } from './review-priority.service.js';

function mapSession(session: Awaited<ReturnType<typeof reviewQueueRepository.findActiveSession>>) {
  if (!session) {
    return null;
  }

  return {
    id: session.id,
    type: session.type,
    status: session.status,
    totalItems: session.totalItems,
    correctItems: session.correctItems,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    items: session.items.map((item) => ({
      id: item.id,
      position: item.position,
      scheduledFor: item.scheduledFor,
      priorityScore: item.priorityScore,
      answeredAt: item.answeredAt,
      word: {
        ...item.word,
        example: item.word.examples[0] ?? null,
        examples: undefined,
      },
    })),
  };
}

export async function getReviewSummary(userId: string) {
  const now = new Date();
  const hour = 60 * 60 * 1000;
  const next24Hours = new Date(now.getTime() + 24 * hour);
  const windowStart = new Date(now.getTime() - hour);
  const windowEnd = new Date(now.getTime() + hour);
  const last24Hours = new Date(now.getTime() - 24 * hour);

  const [
    dueNow,
    goldenWindow,
    dueNext24Hours,
    learnedWords,
    reviewedLast24Hours,
    nextReview,
    distribution,
  ] = await Promise.all([
    reviewQueueRepository.countDueNow(userId, now),
    reviewQueueRepository.countGoldenWindow(userId, windowStart, windowEnd),
    reviewQueueRepository.countDueNext24Hours(userId, now, next24Hours),
    reviewQueueRepository.countLearnedWords(userId),
    reviewQueueRepository.countReviewedSince(userId, last24Hours),
    reviewQueueRepository.findNextReview(userId, now),
    reviewQueueRepository.masteryDistribution(userId),
  ]);

  return {
    dueNow,
    goldenWindow,
    dueNext24Hours,
    learnedWords,
    reviewedLast24Hours,
    nextReviewAt: nextReview?.nextReviewAt ?? null,
    masteryDistribution: distribution.map((item) => ({
      masteryLevel: item.masteryLevel,
      count: item._count._all,
    })),
  };
}

export async function getActiveReviewSession(userId: string) {
  const session = await reviewQueueRepository.findActiveSession(userId);
  return mapSession(session);
}

export async function startReviewSession(userId: string, limit: number) {
  const active = await reviewQueueRepository.findActiveSession(userId);

  if (active) {
    return {
      reused: true,
      session: mapSession(active),
    };
  }

  const now = new Date();
  const poolSize = Math.max(limit * 5, 100);
  const candidates = await reviewQueueRepository.findDueCandidates(
    userId,
    now,
    poolSize,
  );

  const selected = candidates
    .map((candidate) => ({
      ...candidate,
      priorityScore: calculateReviewPriority(candidate, now),
    }))
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }

      const aTime = a.nextReviewAt?.getTime() ?? 0;
      const bTime = b.nextReviewAt?.getTime() ?? 0;
      return aTime - bTime;
    })
    .slice(0, limit);

  if (selected.length === 0) {
    return {
      reused: false,
      session: null,
    };
  }

  const session = await reviewQueueRepository.createSession(
    userId,
    selected.map((item, index) => ({
      wordId: item.wordId,
      position: index + 1,
      scheduledFor: item.nextReviewAt,
      priorityScore: item.priorityScore,
    })),
  );

  return {
    reused: false,
    session: mapSession(session),
  };
}

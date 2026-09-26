import {
  ContentStatus,
  ReviewRating,
} from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { contentPracticeRepository } from '../repositories/content-practice.repository.js';
import { AppError } from '../utils/app-error.js';
import { applyContentRating } from './content-mastery-policy.service.js';

export async function getContentPracticeSummary(userId: string) {
  const now = new Date();
  const [
    grammarDue,
    grammarNew,
    kanjiDue,
    kanjiNew,
    grammarLearned,
    kanjiLearned,
  ] = await Promise.all([
    contentPracticeRepository.countDueGrammar(userId, now),
    contentPracticeRepository.countNewGrammar(userId),
    contentPracticeRepository.countDueKanji(userId, now),
    contentPracticeRepository.countNewKanji(userId),
    prisma.userGrammarState.count({ where: { userId } }),
    prisma.userKanjiState.count({ where: { userId } }),
  ]);

  return {
    grammar: {
      due: grammarDue,
      new: grammarNew,
      learned: grammarLearned,
    },
    kanji: {
      due: kanjiDue,
      new: kanjiNew,
      learned: kanjiLearned,
    },
  };
}

export async function getGrammarPracticeQueue(
  userId: string,
  limit: number,
) {
  const now = new Date();
  const due = await contentPracticeRepository.findDueGrammar(
    userId,
    now,
    limit,
  );

  type GrammarContent = (typeof due)[number]['grammarPoint'];
  type QueueState = {
    masteryLevel: number;
    memoryStrength: number;
    nextReviewAt: Date | null;
    incorrectCount: number;
    lapseCount: number;
    reviewCount: number;
  };

  const items: Array<{
    reason: 'DUE' | 'NEW';
    state: QueueState | null;
    content: GrammarContent;
  }> = due.map((state) => ({
    reason: 'DUE',
    state: {
      masteryLevel: state.masteryLevel,
      memoryStrength: state.memoryStrength,
      nextReviewAt: state.nextReviewAt,
      incorrectCount: state.incorrectCount,
      lapseCount: state.lapseCount,
      reviewCount: state.reviewCount,
    },
    content: state.grammarPoint,
  }));

  if (items.length < limit) {
    const fresh = await contentPracticeRepository.findNewGrammar(
      userId,
      limit - items.length,
    );

    items.push(...fresh.map((content) => ({
      reason: 'NEW' as const,
      state: null,
      content,
    })));
  }

  return {
    generatedAt: now,
    count: items.length,
    items,
  };
}

export async function getKanjiPracticeQueue(
  userId: string,
  limit: number,
) {
  const now = new Date();
  const due = await contentPracticeRepository.findDueKanji(
    userId,
    now,
    limit,
  );

  type RawKanji = (typeof due)[number]['kanji'];
  type KanjiWord = RawKanji['words'][number]['word'];
  type KanjiContent = Omit<RawKanji, 'words'> & {
    words: KanjiWord[];
  };
  type QueueState = {
    masteryLevel: number;
    memoryStrength: number;
    nextReviewAt: Date | null;
    incorrectCount: number;
    lapseCount: number;
    reviewCount: number;
  };

  const items: Array<{
    reason: 'DUE' | 'NEW';
    state: QueueState | null;
    content: KanjiContent;
  }> = due.map((state) => ({
    reason: 'DUE',
    state: {
      masteryLevel: state.masteryLevel,
      memoryStrength: state.memoryStrength,
      nextReviewAt: state.nextReviewAt,
      incorrectCount: state.incorrectCount,
      lapseCount: state.lapseCount,
      reviewCount: state.reviewCount,
    },
    content: {
      ...state.kanji,
      words: state.kanji.words.map((link) => link.word),
    },
  }));

  if (items.length < limit) {
    const fresh = await contentPracticeRepository.findNewKanji(
      userId,
      limit - items.length,
    );

    items.push(...fresh.map((content) => ({
      reason: 'NEW' as const,
      state: null,
      content: {
        ...content,
        words: content.words.map((link) => link.word),
      },
    })));
  }

  return {
    generatedAt: now,
    count: items.length,
    items,
  };
}

export async function rateGrammar(args: {
  userId: string;
  grammarId: string;
  rating: ReviewRating;
  responseTimeMs: number;
  idempotencyKey: string;
}) {
  const existing = await prisma.grammarReviewEvent.findUnique({
    where: { idempotencyKey: args.idempotencyKey },
  });

  if (existing) {
    if (
      existing.userId !== args.userId ||
      existing.grammarPointId !== args.grammarId
    ) {
      throw new AppError(
        409,
        'IDEMPOTENCY_KEY_CONFLICT',
        'Idempotency key is already used by another grammar review.',
      );
    }

    const state = await prisma.userGrammarState.findUnique({
      where: {
        userId_grammarPointId: {
          userId: args.userId,
          grammarPointId: args.grammarId,
        },
      },
    });

    return { idempotent: true, event: existing, state };
  }

  const grammar = await prisma.grammarPoint.findFirst({
    where: {
      id: args.grammarId,
      status: ContentStatus.PUBLISHED,
    },
    select: { id: true },
  });

  if (!grammar) {
    throw new AppError(
      404,
      'GRAMMAR_NOT_FOUND',
      'Published grammar point was not found.',
    );
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.userGrammarState.findUnique({
      where: {
        userId_grammarPointId: {
          userId: args.userId,
          grammarPointId: args.grammarId,
        },
      },
    });

    const now = new Date();
    const next = applyContentRating({
      current,
      rating: args.rating,
      responseTimeMs: args.responseTimeMs,
      now,
    });

    const state = await tx.userGrammarState.upsert({
      where: {
        userId_grammarPointId: {
          userId: args.userId,
          grammarPointId: args.grammarId,
        },
      },
      create: {
        userId: args.userId,
        grammarPointId: args.grammarId,
        masteryLevel: next.masteryLevel,
        memoryStrength: next.memoryStrength,
        firstLearnedAt: now,
        lastReviewedAt: now,
        nextReviewAt: next.nextReviewAt,
        correctCount: next.correctCount,
        incorrectCount: next.incorrectCount,
        lapseCount: next.lapseCount,
        reviewCount: next.reviewCount,
        streak: next.streak,
        averageResponseTimeMs: next.averageResponseTimeMs,
      },
      update: {
        masteryLevel: next.masteryLevel,
        memoryStrength: next.memoryStrength,
        lastReviewedAt: now,
        nextReviewAt: next.nextReviewAt,
        correctCount: next.correctCount,
        incorrectCount: next.incorrectCount,
        lapseCount: next.lapseCount,
        reviewCount: next.reviewCount,
        streak: next.streak,
        averageResponseTimeMs: next.averageResponseTimeMs,
      },
    });

    const event = await tx.grammarReviewEvent.create({
      data: {
        userId: args.userId,
        grammarPointId: args.grammarId,
        isCorrect: next.isCorrect,
        rating: args.rating,
        responseTimeMs: args.responseTimeMs,
        previousMasteryLevel: next.previousMasteryLevel,
        newMasteryLevel: next.masteryLevel,
        previousMemoryStrength: next.previousMemoryStrength,
        newMemoryStrength: next.memoryStrength,
        idempotencyKey: args.idempotencyKey,
        reviewedAt: now,
      },
    });

    return { idempotent: false, event, state };
  });
}

export async function rateKanji(args: {
  userId: string;
  kanjiId: string;
  rating: ReviewRating;
  responseTimeMs: number;
  idempotencyKey: string;
}) {
  const existing = await prisma.kanjiReviewEvent.findUnique({
    where: { idempotencyKey: args.idempotencyKey },
  });

  if (existing) {
    if (
      existing.userId !== args.userId ||
      existing.kanjiId !== args.kanjiId
    ) {
      throw new AppError(
        409,
        'IDEMPOTENCY_KEY_CONFLICT',
        'Idempotency key is already used by another kanji review.',
      );
    }

    const state = await prisma.userKanjiState.findUnique({
      where: {
        userId_kanjiId: {
          userId: args.userId,
          kanjiId: args.kanjiId,
        },
      },
    });

    return { idempotent: true, event: existing, state };
  }

  const kanji = await prisma.kanji.findFirst({
    where: {
      id: args.kanjiId,
      status: ContentStatus.PUBLISHED,
    },
    select: { id: true },
  });

  if (!kanji) {
    throw new AppError(
      404,
      'KANJI_NOT_FOUND',
      'Published kanji was not found.',
    );
  }

  return prisma.$transaction(async (tx) => {
    const current = await tx.userKanjiState.findUnique({
      where: {
        userId_kanjiId: {
          userId: args.userId,
          kanjiId: args.kanjiId,
        },
      },
    });

    const now = new Date();
    const next = applyContentRating({
      current,
      rating: args.rating,
      responseTimeMs: args.responseTimeMs,
      now,
    });

    const state = await tx.userKanjiState.upsert({
      where: {
        userId_kanjiId: {
          userId: args.userId,
          kanjiId: args.kanjiId,
        },
      },
      create: {
        userId: args.userId,
        kanjiId: args.kanjiId,
        masteryLevel: next.masteryLevel,
        memoryStrength: next.memoryStrength,
        firstLearnedAt: now,
        lastReviewedAt: now,
        nextReviewAt: next.nextReviewAt,
        correctCount: next.correctCount,
        incorrectCount: next.incorrectCount,
        lapseCount: next.lapseCount,
        reviewCount: next.reviewCount,
        streak: next.streak,
        averageResponseTimeMs: next.averageResponseTimeMs,
      },
      update: {
        masteryLevel: next.masteryLevel,
        memoryStrength: next.memoryStrength,
        lastReviewedAt: now,
        nextReviewAt: next.nextReviewAt,
        correctCount: next.correctCount,
        incorrectCount: next.incorrectCount,
        lapseCount: next.lapseCount,
        reviewCount: next.reviewCount,
        streak: next.streak,
        averageResponseTimeMs: next.averageResponseTimeMs,
      },
    });

    const event = await tx.kanjiReviewEvent.create({
      data: {
        userId: args.userId,
        kanjiId: args.kanjiId,
        isCorrect: next.isCorrect,
        rating: args.rating,
        responseTimeMs: args.responseTimeMs,
        previousMasteryLevel: next.previousMasteryLevel,
        newMasteryLevel: next.masteryLevel,
        previousMemoryStrength: next.previousMemoryStrength,
        newMemoryStrength: next.memoryStrength,
        idempotencyKey: args.idempotencyKey,
        reviewedAt: now,
      },
    });

    return { idempotent: false, event, state };
  });
}

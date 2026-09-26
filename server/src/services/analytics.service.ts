import type { StudySessionType } from '../generated/prisma/client.js';
import { analyticsRepository } from '../repositories/analytics.repository.js';

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
  ));
}

function addUtcDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function buildDayRange(days: number, now: Date) {
  const today = startOfUtcDay(now);
  const first = addUtcDays(today, -(days - 1));
  return Array.from({ length: days }, (_, index) => {
    const date = addUtcDays(first, index);
    return { key: dateKey(date), date };
  });
}

function durationMinutes(startedAt: Date, endedAt: Date | null) {
  if (!endedAt) return 0;
  const milliseconds = Math.max(0, endedAt.getTime() - startedAt.getTime());
  return Math.round(milliseconds / 60000);
}

function calculateCurrentStreak(reviewDates: Date[], now: Date) {
  const distinct = new Set(reviewDates.map((value) => dateKey(value)));
  if (distinct.size === 0) return 0;
  const today = startOfUtcDay(now);
  const yesterday = addUtcDays(today, -1);
  let cursor = distinct.has(dateKey(today))
    ? today
    : distinct.has(dateKey(yesterday))
      ? yesterday
      : null;
  if (!cursor) return 0;
  let streak = 0;
  while (distinct.has(dateKey(cursor))) {
    streak += 1;
    cursor = addUtcDays(cursor, -1);
  }
  return streak;
}

export async function getLearningAnalytics(userId: string, days: number) {
  const now = new Date();
  const range = buildDayRange(days, now);
  const since = range[0]?.date ?? startOfUtcDay(now);
  const [
    learnedWords,
    savedWords,
    completedLessons,
    dueNow,
    masteryStates,
    reviewEvents,
    sessions,
    quizzes,
    difficultWords,
    streakDates,
  ] = await Promise.all([
    analyticsRepository.countLearnedWords(userId),
    analyticsRepository.countSavedWords(userId),
    analyticsRepository.countCompletedLessons(userId),
    analyticsRepository.countDueWords(userId, now),
    analyticsRepository.masteryStates(userId),
    analyticsRepository.reviewEventsSince(userId, since),
    analyticsRepository.completedSessionsSince(userId, since),
    analyticsRepository.completedQuizzesSince(userId, since),
    analyticsRepository.difficultWords(userId, 8),
    analyticsRepository.allReviewDates(userId, addUtcDays(startOfUtcDay(now), -365)),
  ]);

  const totalReviews = reviewEvents.length;
  const correctReviews = reviewEvents.filter((event) => event.isCorrect).length;
  const accuracyPercent = totalReviews > 0
    ? Math.round((correctReviews / totalReviews) * 100)
    : 0;
  const studyMinutes = sessions.reduce(
    (sum, session) => sum + durationMinutes(session.startedAt, session.endedAt),
    0,
  );
  const activityMap = new Map(
    range.map((day) => [day.key, {
      date: day.key,
      reviews: 0,
      correct: 0,
      sessions: 0,
      studyMinutes: 0,
    }]),
  );

  for (const event of reviewEvents) {
    const item = activityMap.get(dateKey(event.reviewedAt));
    if (!item) continue;
    item.reviews += 1;
    if (event.isCorrect) item.correct += 1;
  }

  for (const session of sessions) {
    const item = activityMap.get(dateKey(session.startedAt));
    if (!item) continue;
    item.sessions += 1;
    item.studyMinutes += durationMinutes(session.startedAt, session.endedAt);
  }

  const masteryDistribution = Array.from({ length: 6 }, (_, masteryLevel) => ({
    masteryLevel,
    count: masteryStates.filter((state) => state.masteryLevel === masteryLevel).length,
  }));

  const modeMap = new Map<StudySessionType, {
    type: StudySessionType;
    sessions: number;
    totalItems: number;
    correctItems: number;
    studyMinutes: number;
  }>();

  for (const session of sessions) {
    const current = modeMap.get(session.type) ?? {
      type: session.type,
      sessions: 0,
      totalItems: 0,
      correctItems: 0,
      studyMinutes: 0,
    };
    current.sessions += 1;
    current.totalItems += session.totalItems;
    current.correctItems += session.correctItems;
    current.studyMinutes += durationMinutes(session.startedAt, session.endedAt);
    modeMap.set(session.type, current);
  }

  const modes = Array.from(modeMap.values()).map((mode) => ({
    ...mode,
    accuracyPercent: mode.totalItems > 0
      ? Math.round((mode.correctItems / mode.totalItems) * 100)
      : 0,
  }));

  const quizScores = quizzes.map((quiz) => (
    quiz.totalQuestions > 0
      ? Math.round((quiz.correctAnswers / quiz.totalQuestions) * 100)
      : 0
  ));
  const averageQuizScore = quizScores.length > 0
    ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length)
    : 0;
  const bestQuizScore = quizScores.length > 0 ? Math.max(...quizScores) : 0;

  return {
    period: { days, from: since, to: now },
    overview: {
      learnedWords,
      savedWords,
      completedLessons,
      dueNow,
      currentStreakDays: calculateCurrentStreak(
        streakDates.map((item) => item.reviewedAt),
        now,
      ),
      totalReviews,
      accuracyPercent,
      studyMinutes,
      completedSessions: sessions.length,
    },
    activity: Array.from(activityMap.values()),
    masteryDistribution,
    modes,
    quiz: {
      completedAttempts: quizzes.length,
      averageScorePercent: averageQuizScore,
      bestScorePercent: bestQuizScore,
    },
    difficultWords,
  };
}

export type AnalyticsActivityPoint = {
  date: string;
  reviews: number;
  correct: number;
  sessions: number;
  studyMinutes: number;
};

export type MasteryBucket = { masteryLevel: number; count: number };

export type ModeAnalytics = {
  type: 'LEARNING' | 'REVIEW' | 'SMART_STUDY';
  sessions: number;
  totalItems: number;
  correctItems: number;
  studyMinutes: number;
  accuracyPercent: number;
};

export type DifficultWord = {
  masteryLevel: number;
  memoryStrength: number;
  correctCount: number;
  incorrectCount: number;
  lapseCount: number;
  reviewCount: number;
  streak: number;
  nextReviewAt: string | null;
  word: {
    id: string;
    writtenForm: string | null;
    reading: string;
    meaningVi: string;
    meaningEn: string | null;
  };
};

export type LearningAnalytics = {
  period: { days: number; from: string; to: string };
  overview: {
    learnedWords: number;
    savedWords: number;
    completedLessons: number;
    dueNow: number;
    currentStreakDays: number;
    totalReviews: number;
    accuracyPercent: number;
    studyMinutes: number;
    completedSessions: number;
  };
  activity: AnalyticsActivityPoint[];
  masteryDistribution: MasteryBucket[];
  modes: ModeAnalytics[];
  quiz: {
    completedAttempts: number;
    averageScorePercent: number;
    bestScorePercent: number;
  };
  difficultWords: DifficultWord[];
};

export type LearningAnalyticsResponse = { status: 'ok'; data: LearningAnalytics };

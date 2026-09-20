export type ReviewRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export type LessonProgress = {
  id: string;
  userId: string;
  lessonId: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  currentPosition: number;
  completedAt: string | null;
  lastStudiedAt: string | null;
};

export type StudySession = {
  id: string;
  userId: string;
  lessonId: string | null;
  type: 'LEARNING' | 'REVIEW' | 'SMART_STUDY';
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  totalItems: number;
  correctItems: number;
  startedAt: string;
  endedAt: string | null;
};

export type StartLessonResponse = {
  status: 'ok';
  data: {
    lesson: {
      id: string;
      title: string;
      wordCount: number;
    };
    progress: LessonProgress;
    session: StudySession;
  };
};

export type ProgressResponse = {
  status: 'ok';
  data: LessonProgress | null;
};

export type AnswerResponse = {
  status: 'ok';
  data: {
    idempotent: boolean;
    event: {
      id: string;
      wordId: string;
      sessionId: string | null;
      isCorrect: boolean;
      rating: ReviewRating | null;
      responseTimeMs: number | null;
      previousMasteryLevel: number | null;
      newMasteryLevel: number | null;
      previousMemoryStrength: number | null;
      newMemoryStrength: number | null;
      reviewedAt: string;
    };
    state: {
      id: string;
      masteryLevel: number;
      memoryStrength: number;
      correctCount: number;
      incorrectCount: number;
      lapseCount: number;
      reviewCount: number;
      streak: number;
      averageResponseTimeMs: number | null;
      lastReviewedAt: string | null;
      nextReviewAt: string | null;
    } | null;
  };
};

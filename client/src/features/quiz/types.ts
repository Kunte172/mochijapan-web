export type QuizQuestionType =
  | 'WORD_TO_MEANING'
  | 'MEANING_TO_WORD'
  | 'READING_TO_MEANING'
  | 'AUDIO_TO_MEANING';

export type QuizOption = {
  id: string;
  label: string;
};

export type QuizQuestion = {
  id: string;
  position: number;
  type: QuizQuestionType;
  prompt: {
    primary: string;
    secondary: string | null;
    audioUrl: string | null;
  };
  options: QuizOption[];
};

export type QuizAttempt = {
  id: string;
  lesson: {
    id: string;
    title: string;
    titleEn: string | null;
  };
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  totalQuestions: number;
  correctAnswers: number;
  answeredCount: number;
  scorePercent: number;
  startedAt: string;
  completedAt: string | null;
  currentQuestion: QuizQuestion | null;
};

export type QuizStartResponse = {
  status: 'ok';
  data: {
    reused: boolean;
    attempt: QuizAttempt;
  };
};

export type QuizAttemptResponse = {
  status: 'ok';
  data: QuizAttempt;
};

export type QuizAnswerResponse = {
  status: 'ok';
  data: {
    idempotent: boolean;
    isCorrect: boolean;
    correctOptionId: string;
    selectedOptionId: string | null;
    attemptCompleted: boolean;
    attempt: QuizAttempt;
  };
};

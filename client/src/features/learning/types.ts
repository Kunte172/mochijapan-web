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

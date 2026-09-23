export type SavedWordSource =
  | 'LESSON'
  | 'DICTIONARY'
  | 'AI_TUTOR'
  | 'MANUAL';

export type LearningState = {
  masteryLevel: number;
  memoryStrength: number;
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
  correctCount: number;
  incorrectCount: number;
  lapseCount: number;
  reviewCount: number;
  streak: number;
};

export type NotebookWord = {
  id: string;
  wordId: string;
  source: SavedWordSource;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  isDue: boolean;
  learningState: LearningState | null;
  word: {
    id: string;
    writtenForm: string | null;
    reading: string;
    romaji: string | null;
    meaningVi: string;
    meaningEn: string | null;
    partOfSpeech: string | null;
    audioUrl: string | null;
    pictureUrl: string | null;
    examples: Array<{
      id: string;
      japanese: string;
      vietnamese: string | null;
      english: string | null;
    }>;
  };
};

export type NotebookListResponse = {
  status: 'ok';
  data: {
    items: NotebookWord[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
};

export type NotebookSummaryResponse = {
  status: 'ok';
  data: {
    total: number;
    dueNow: number;
    bySource: Partial<Record<SavedWordSource, number>>;
  };
};

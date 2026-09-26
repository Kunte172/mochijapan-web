export type ReviewRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export type PracticeState = {
  masteryLevel: number;
  memoryStrength: number;
  nextReviewAt: string | null;
  incorrectCount: number;
  lapseCount: number;
  reviewCount: number;
};

export type PracticeSummary = {
  grammar: {
    due: number;
    new: number;
    learned: number;
  };
  kanji: {
    due: number;
    new: number;
    learned: number;
  };
};

export type GrammarPracticeItem = {
  reason: 'DUE' | 'NEW';
  state: PracticeState | null;
  content: {
    id: string;
    pattern: string;
    meaningVi: string;
    meaningEn: string | null;
    explanationVi: string | null;
    explanationEn: string | null;
    formation: string | null;
    jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | null;
    examples: Array<{
      id: string;
      japanese: string;
      vietnamese: string | null;
      english: string | null;
    }>;
  };
};

export type KanjiPracticeItem = {
  reason: 'DUE' | 'NEW';
  state: PracticeState | null;
  content: {
    id: string;
    character: string;
    meaningsVi: string[];
    meaningsEn: string[];
    onyomi: string[];
    kunyomi: string[];
    jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | null;
    strokeCount: number | null;
    radical: string | null;
    words: Array<{
      id: string;
      writtenForm: string | null;
      reading: string;
      meaningVi: string;
      meaningEn: string | null;
    }>;
  };
};

export type PracticeQueue<T> = {
  generatedAt: string;
  count: number;
  items: T[];
};

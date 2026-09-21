import type { ReviewRating } from '../learning/types';

export type ReviewSummary = {
  dueNow: number;
  goldenWindow: number;
  dueNext24Hours: number;
  learnedWords: number;
  reviewedLast24Hours: number;
  nextReviewAt: string | null;
  masteryDistribution: Array<{
    masteryLevel: number;
    count: number;
  }>;
};

export type ReviewSessionWord = {
  id: string;
  sourceWordId: number | null;
  writtenForm: string | null;
  reading: string;
  romaji: string | null;
  meaningVi: string;
  meaningEn: string | null;
  partOfSpeech: string | null;
  audioUrl: string | null;
  pictureUrl: string | null;
  example: {
    id: string;
    japanese: string;
    vietnamese: string | null;
    english: string | null;
  } | null;
};

export type ReviewSessionItem = {
  id: string;
  position: number;
  scheduledFor: string | null;
  priorityScore: number;
  answeredAt: string | null;
  word: ReviewSessionWord;
};

export type ReviewSession = {
  id: string;
  type: 'REVIEW';
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  totalItems: number;
  correctItems: number;
  startedAt: string;
  endedAt: string | null;
  items: ReviewSessionItem[];
};

export type ReviewSessionStartResponse = {
  status: 'ok';
  data: {
    reused: boolean;
    session: ReviewSession | null;
  };
};

export type ReviewSessionResponse = {
  status: 'ok';
  data: ReviewSession | null;
};

export type ReviewSummaryResponse = {
  status: 'ok';
  data: ReviewSummary;
};

export type ReviewRateInput = {
  rating: ReviewRating;
};

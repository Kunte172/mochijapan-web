import type { CourseCatalogItem, RawLesson, RawWord } from './schemas.js';

export type IssueSeverity = 'ERROR' | 'WARNING';

export type ImportIssue = {
  severity: IssueSeverity;
  code: string;
  sourcePath: string;
  sourceId?: number;
  message: string;
  details?: unknown;
};

export type WordOccurrence = {
  sourcePath: string;
  lessonDir: string;
  courseFolderId: number;
  lessonFolderId: number;
  orderInLesson: number;
  data: RawWord;
};

export type LessonBundle = {
  sourcePath: string;
  lessonDir: string;
  courseFolderId: number;
  lessonFolderId: number;
  lesson: RawLesson;
  words: WordOccurrence[];
};

export type ScanSummary = {
  courses: number;
  lessons: number;
  wordOccurrences: number;
  normalizedLessonWordLinks: number;
  duplicateLessonWordOccurrences: number;
  uniqueSourceWordIds: number;
  duplicateSourceWordIds: number;
  conflictingSourceWordIds: number;
  audioReferences: number;
  pictureReferences: number;
  missingAudioFiles: number;
  missingPictureFiles: number;
};

export type ScanResult = {
  catalog: CourseCatalogItem[];
  lessons: LessonBundle[];
  canonicalWords: Map<number, WordOccurrence>;
  issues: ImportIssue[];
  summary: ScanSummary;
};

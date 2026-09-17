export type LessonWord = {
  position: number;
  id: string;
  sourceWordId: number | null;
  code: string | null;
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

export type LessonDetail = {
  id: string;
  sourceLessonId: number | null;
  code: string | null;
  title: string;
  titleEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  sortOrder: number;
  course: {
    id: string;
    code: string | null;
    title: string;
    titleEn: string | null;
  };
  wordCount: number;
  words: LessonWord[];
};

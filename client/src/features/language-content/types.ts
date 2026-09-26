export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type GrammarExample = {
  id: string;
  japanese: string;
  vietnamese: string | null;
  english: string | null;
};

export type GrammarPoint = {
  id: string;
  code: string;
  pattern: string;
  meaningVi: string;
  meaningEn: string | null;
  explanationVi: string | null;
  explanationEn: string | null;
  formation: string | null;
  jlptLevel: JlptLevel | null;
  tags: string[];
  examples: GrammarExample[];
};

export type KanjiListItem = {
  id: string;
  character: string;
  meaningsVi: string[];
  meaningsEn: string[];
  onyomi: string[];
  kunyomi: string[];
  jlptLevel: JlptLevel | null;
  grade: number | null;
  strokeCount: number | null;
  radical: string | null;
  frequency: number | null;
  wordCount: number;
};

export type KanjiDetail = KanjiListItem & {
  nanori: string[];
  words: Array<{
    id: string;
    writtenForm: string | null;
    reading: string;
    romaji: string | null;
    meaningVi: string;
    meaningEn: string | null;
  }>;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type GrammarListResponse = {
  status: 'ok';
  data: {
    items: GrammarPoint[];
    pagination: Pagination;
  };
};

export type GrammarDetailResponse = {
  status: 'ok';
  data: GrammarPoint;
};

export type KanjiListResponse = {
  status: 'ok';
  data: {
    items: KanjiListItem[];
    pagination: Pagination;
  };
};

export type KanjiDetailResponse = {
  status: 'ok';
  data: KanjiDetail;
};

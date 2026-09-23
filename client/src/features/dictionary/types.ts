export type DictionaryExample = {
  id: string;
  japanese: string;
  vietnamese: string | null;
  english: string | null;
};

export type DictionaryWord = {
  id: string;
  sourceWordId: number | null;
  code: string | null;
  writtenForm: string | null;
  reading: string;
  romaji: string | null;
  meaningVi: string;
  meaningEn: string | null;
  partOfSpeech: string | null;
  searchForms: string[];
  otherForm: string | null;
  audioUrl: string | null;
  pictureUrl: string | null;
  examples: DictionaryExample[];
};

export type DictionarySearchResponse = {
  status: 'ok';
  data: {
    query: string;
    count: number;
    words: DictionaryWord[];
  };
};

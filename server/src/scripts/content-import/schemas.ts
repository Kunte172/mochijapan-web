import { z } from 'zod';

export const rawLessonSchema = z.object({
  id: z.number().int().positive(),
  course_id: z.number().int().positive(),
  sort: z.number().int().nonnegative().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  en_title: z.string().optional().nullable(),
  en_description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
}).passthrough();

export const rawWordSchema = z.object({
  id: z.number().int().positive(),
  code: z.string().optional().nullable(),
  audio: z.string().optional().nullable(),
  picture: z.string().optional().nullable(),
  content: z.string().min(1),
  trans: z.string().min(1),
  phonetic: z.string().optional().nullable(),
  hint: z.string().optional().nullable(),
  kanji: z.string().optional().nullable(),
  sentence_ja: z.string().optional().nullable(),
  sentence_vi: z.string().optional().nullable(),
  sentence_en: z.string().optional().nullable(),
  en_trans: z.string().optional().nullable(),
  en_hint: z.string().optional().nullable(),
  vi_hint: z.string().optional().nullable(),
  multi_answer: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  review: z.number().int().optional().nullable(),
  wm_id: z.number().int().optional().nullable(),
  other_form: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
  course_id: z.number().int().positive(),
  lesson_id: z.number().int().positive(),
  pivot: z.object({
    lesson_id: z.number().int().positive(),
    word_id: z.number().int().positive(),
  }).optional().nullable(),
}).passthrough();

export type RawLesson = z.infer<typeof rawLessonSchema>;
export type RawWord = z.infer<typeof rawWordSchema>;

export const courseCatalogSchema = z.array(z.object({
  sourceCourseId: z.number().int().positive(),
  code: z.string().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  titleEn: z.string().optional().nullable(),
  descriptionEn: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  sortOrder: z.number().int().nonnegative(),
  outcomeVi: z.string().optional().nullable(),
  outcomeEn: z.string().optional().nullable(),
}));

export type CourseCatalogItem = z.infer<typeof courseCatalogSchema>[number];

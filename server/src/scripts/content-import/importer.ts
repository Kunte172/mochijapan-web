import { ContentStatus, Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import type { LessonBundle, ScanResult, WordOccurrence } from './types.js';
import { chunk, nonBlank, resolveMediaUrl, searchFormsFromWord } from './utils.js';

const LESSON_BATCH_SIZE = 15;
const WORD_BATCH_SIZE = 15;
const LESSON_WORD_BATCH_SIZE = 20;
const EXAMPLE_BATCH_SIZE = 15;

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function exampleFromOccurrence(occurrence: WordOccurrence) {
  const word = occurrence.data;
  const japanese = nonBlank(word.sentence_ja) ?? nonBlank(word.hint);

  if (!japanese) return null;

  return {
    sourceKey: `source-word:${word.id}:primary`,
    japanese,
    vietnamese: nonBlank(word.sentence_vi) ?? nonBlank(word.vi_hint),
    english: nonBlank(word.sentence_en) ?? nonBlank(word.en_hint),
  };
}

function logProgress(label: string, processed: number, total: number) {
  if (processed === total || processed % 500 === 0) {
    console.log(`  ${label}: ${processed}/${total}`);
  }
}

function buildNormalizedLessonWordItems(lessons: LessonBundle[]) {
  const unique = new Map<
    string,
    {
      lesson: LessonBundle;
      occurrence: WordOccurrence;
    }
  >();

  for (const lesson of lessons) {
    for (const occurrence of lesson.words) {
      const key = `${lesson.lesson.id}:${occurrence.data.id}`;
      const existing = unique.get(key);

      if (!existing || occurrence.orderInLesson < existing.occurrence.orderInLesson) {
        unique.set(key, { lesson, occurrence });
      }
    }
  }

  return [...unique.values()];
}

export async function importDataset(args: {
  scan: ScanResult;
  publish: boolean;
  mediaBaseUrl: string;
}) {
  const status = args.publish ? ContentStatus.PUBLISHED : ContentStatus.DRAFT;
  const courseIdMap = new Map<number, string>();
  const lessonIdMap = new Map<number, string>();
  const wordIdMap = new Map<number, string>();

  console.log('\n[1/5] Upserting courses...');

  const sortedCatalog = [...args.scan.catalog].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const item of sortedCatalog) {
    const course = await prisma.course.upsert({
      where: {
        sourceCourseId: item.sourceCourseId,
      },
      create: {
        sourceCourseId: item.sourceCourseId,
        code: item.code ?? null,
        title: item.title,
        titleEn: item.titleEn ?? null,
        description: item.description ?? null,
        descriptionEn: item.descriptionEn ?? null,
        imageUrl: item.imageUrl ?? null,
        outcomeVi: item.outcomeVi ?? null,
        outcomeEn: item.outcomeEn ?? null,
        sortOrder: item.sortOrder,
        status,
        sourceMetadata: jsonValue(item),
      },
      update: {
        code: item.code ?? null,
        title: item.title,
        titleEn: item.titleEn ?? null,
        description: item.description ?? null,
        descriptionEn: item.descriptionEn ?? null,
        imageUrl: item.imageUrl ?? null,
        outcomeVi: item.outcomeVi ?? null,
        outcomeEn: item.outcomeEn ?? null,
        sortOrder: item.sortOrder,
        status,
        sourceMetadata: jsonValue(item),
      },
    });

    courseIdMap.set(item.sourceCourseId, course.id);
  }

  console.log('[2/5] Upserting lessons...');

  let processedLessons = 0;

  for (const batch of chunk(args.scan.lessons, LESSON_BATCH_SIZE)) {
    const results = await Promise.all(
      batch.map((bundle) => {
        const courseId = courseIdMap.get(bundle.courseFolderId);

        if (!courseId) {
          throw new Error(`Missing imported course ${bundle.courseFolderId}`);
        }

        return prisma.lesson.upsert({
          where: {
            courseId_sourceLessonId: {
              courseId,
              sourceLessonId: bundle.lesson.id,
            },
          },
          create: {
            sourceLessonId: bundle.lesson.id,
            courseId,
            code: bundle.lesson.code ?? null,
            title: bundle.lesson.title,
            titleEn: bundle.lesson.en_title ?? null,
            description: bundle.lesson.description ?? null,
            descriptionEn: bundle.lesson.en_description ?? null,
            imageUrl: bundle.lesson.image ?? null,
            sortOrder: bundle.lesson.sort ?? 0,
            status,
            sourceMetadata: jsonValue(bundle.lesson),
          },
          update: {
            code: bundle.lesson.code ?? null,
            title: bundle.lesson.title,
            titleEn: bundle.lesson.en_title ?? null,
            description: bundle.lesson.description ?? null,
            descriptionEn: bundle.lesson.en_description ?? null,
            imageUrl: bundle.lesson.image ?? null,
            sortOrder: bundle.lesson.sort ?? 0,
            status,
            sourceMetadata: jsonValue(bundle.lesson),
          },
        });
      }),
    );

    results.forEach((lesson, index) => {
      lessonIdMap.set(batch[index].lesson.id, lesson.id);
    });

    processedLessons += batch.length;
    logProgress('lessons', processedLessons, args.scan.lessons.length);
  }

  console.log('[3/5] Upserting canonical words...');

  const canonical = [...args.scan.canonicalWords.entries()].sort(([a], [b]) => a - b);
  let processedWords = 0;

  for (const batch of chunk(canonical, WORD_BATCH_SIZE)) {
    const results = await Promise.all(
      batch.map(([sourceWordId, occurrence]) => {
        const raw = occurrence.data;

        const audio = resolveMediaUrl({
          lessonDir: occurrence.lessonDir,
          courseFolderId: occurrence.courseFolderId,
          lessonFolderId: occurrence.lessonFolderId,
          kind: 'audio',
          sourceUrl: raw.audio,
          mediaBaseUrl: args.mediaBaseUrl,
        });

        const picture = resolveMediaUrl({
          lessonDir: occurrence.lessonDir,
          courseFolderId: occurrence.courseFolderId,
          lessonFolderId: occurrence.lessonFolderId,
          kind: 'picture',
          sourceUrl: raw.picture,
          mediaBaseUrl: args.mediaBaseUrl,
        });

        const data = {
          code: raw.code ?? null,
          writtenForm: nonBlank(raw.kanji),
          reading: raw.content.trim(),
          romaji: nonBlank(raw.phonetic),
          meaningVi: raw.trans.trim(),
          meaningEn: nonBlank(raw.en_trans),
          partOfSpeech: nonBlank(raw.position),
          searchForms: searchFormsFromWord(raw),
          otherForm: nonBlank(raw.other_form),
          sourceWmId: raw.wm_id ?? null,
          sourceReview: raw.review ?? null,
          audioUrl: audio.url,
          pictureUrl: picture.url,
          sourceMetadata: jsonValue(raw),
        };

        return prisma.word.upsert({
          where: {
            sourceWordId,
          },
          create: {
            sourceWordId,
            ...data,
          },
          update: data,
        });
      }),
    );

    results.forEach((word, index) => {
      wordIdMap.set(batch[index][0], word.id);
    });

    processedWords += batch.length;
    logProgress('words', processedWords, canonical.length);
  }

  console.log('[4/5] Upserting LessonWord relations...');

  const relationItems = buildNormalizedLessonWordItems(args.scan.lessons);
  let processedRelations = 0;

  for (const batch of chunk(relationItems, LESSON_WORD_BATCH_SIZE)) {
    await Promise.all(
      batch.map(({ lesson, occurrence }) => {
        const lessonId = lessonIdMap.get(lesson.lesson.id);
        const wordId = wordIdMap.get(occurrence.data.id);

        if (!lessonId || !wordId) {
          throw new Error(
            `Missing IDs for lesson=${lesson.lesson.id}, word=${occurrence.data.id}`,
          );
        }

        return prisma.lessonWord.upsert({
          where: {
            lessonId_wordId: {
              lessonId,
              wordId,
            },
          },
          create: {
            lessonId,
            wordId,
            position: occurrence.orderInLesson,
          },
          update: {
            position: occurrence.orderInLesson,
          },
        });
      }),
    );

    processedRelations += batch.length;
    logProgress('lessonWords', processedRelations, relationItems.length);
  }

  console.log('[5/5] Upserting primary example sentences...');

  const examples = canonical
    .map(([sourceWordId, occurrence]) => ({
      sourceWordId,
      occurrence,
      example: exampleFromOccurrence(occurrence),
    }))
    .filter((item) => item.example !== null);

  let processedExamples = 0;

  for (const batch of chunk(examples, EXAMPLE_BATCH_SIZE)) {
    await Promise.all(
      batch.map((item) => {
        const wordId = wordIdMap.get(item.sourceWordId);

        if (!wordId || !item.example) {
          throw new Error(`Cannot build example for source word ${item.sourceWordId}`);
        }

        return prisma.exampleSentence.upsert({
          where: {
            sourceKey: item.example.sourceKey,
          },
          create: {
            wordId,
            sourceKey: item.example.sourceKey,
            japanese: item.example.japanese,
            vietnamese: item.example.vietnamese,
            english: item.example.english,
          },
          update: {
            wordId,
            japanese: item.example.japanese,
            vietnamese: item.example.vietnamese,
            english: item.example.english,
          },
        });
      }),
    );

    processedExamples += batch.length;
    logProgress('examples', processedExamples, examples.length);
  }

  return {
    courses: await prisma.course.count(),
    lessons: await prisma.lesson.count(),
    words: await prisma.word.count(),
    lessonWords: await prisma.lessonWord.count(),
    examples: await prisma.exampleSentence.count(),
  };
}

import fs from 'node:fs';
import path from 'node:path';

import {
  courseCatalogSchema,
  rawLessonSchema,
  rawWordSchema,
} from './schemas.js';
import type {
  ImportIssue,
  LessonBundle,
  ScanResult,
  WordOccurrence,
} from './types.js';
import { parseSourceTimestamp, resolveMediaUrl } from './utils.js';

const CONFLICT_FIELDS = [
  'code',
  'content',
  'trans',
  'phonetic',
  'kanji',
  'en_trans',
  'audio',
  'picture',
  'hint',
  'sentence_vi',
  'sentence_en',
  'multi_answer',
  'position',
  'review',
  'wm_id',
  'other_form',
] as const;

function readJson(filePath: string): unknown {
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(text);
}

function numericDirectories(parent: string): string[] {
  return fs.readdirSync(parent, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => Number(a) - Number(b));
}

function serializeComparable(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export function scanDataset(args: {
  dataDir: string;
  catalogPath: string;
  mediaBaseUrl: string;
}): ScanResult {
  const issues: ImportIssue[] = [];

  if (!fs.existsSync(args.dataDir)) {
    throw new Error(`CONTENT_DATA_DIR does not exist: ${args.dataDir}`);
  }

  const catalog = courseCatalogSchema.parse(readJson(args.catalogPath));
  const catalogIds = new Set(catalog.map((item) => item.sourceCourseId));
  const courseFolders = numericDirectories(args.dataDir);
  const courseFolderIds = new Set(courseFolders.map(Number));

  for (const id of catalogIds) {
    if (!courseFolderIds.has(id)) {
      issues.push({
        severity: 'ERROR',
        code: 'COURSE_FOLDER_MISSING',
        sourcePath: args.dataDir,
        sourceId: id,
        message: `Course ${id} exists in catalog but its folder is missing.`,
      });
    }
  }

  for (const id of courseFolderIds) {
    if (!catalogIds.has(id)) {
      issues.push({
        severity: 'ERROR',
        code: 'COURSE_CATALOG_MISSING',
        sourcePath: path.join(args.dataDir, String(id)),
        sourceId: id,
        message: `Course folder ${id} has no catalog metadata.`,
      });
    }
  }

  const lessons: LessonBundle[] = [];
  const occurrencesByWordId = new Map<number, WordOccurrence[]>();

  let audioReferences = 0;
  let pictureReferences = 0;
  let missingAudioFiles = 0;
  let missingPictureFiles = 0;

  for (const courseName of courseFolders) {
    const courseFolderId = Number(courseName);
    const courseDir = path.join(args.dataDir, courseName);

    for (const lessonName of numericDirectories(courseDir)) {
      const lessonFolderId = Number(lessonName);
      const lessonDir = path.join(courseDir, lessonName);
      const lessonPath = path.join(lessonDir, 'lesson.json');
      const wordPath = path.join(lessonDir, 'word.json');

      if (!fs.existsSync(lessonPath) || !fs.existsSync(wordPath)) {
        issues.push({
          severity: 'ERROR',
          code: 'LESSON_FILES_MISSING',
          sourcePath: lessonDir,
          message: 'lesson.json and word.json are both required.',
        });
        continue;
      }

      let lesson;
      let rawWords: unknown;

      try {
        lesson = rawLessonSchema.parse(readJson(lessonPath));
        rawWords = readJson(wordPath);
      } catch (error) {
        issues.push({
          severity: 'ERROR',
          code: 'JSON_OR_SCHEMA_INVALID',
          sourcePath: lessonDir,
          message: error instanceof Error ? error.message : String(error),
        });
        continue;
      }

      if (lesson.id !== lessonFolderId) {
        issues.push({
          severity: 'ERROR',
          code: 'LESSON_FOLDER_ID_MISMATCH',
          sourcePath: lessonPath,
          sourceId: lesson.id,
          message: `lesson.id=${lesson.id} but folder=${lessonFolderId}.`,
        });
      }

      if (lesson.course_id !== courseFolderId) {
        issues.push({
          severity: 'ERROR',
          code: 'LESSON_COURSE_MISMATCH',
          sourcePath: lessonPath,
          sourceId: lesson.id,
          message: `lesson.course_id=${lesson.course_id} but course folder=${courseFolderId}.`,
        });
      }

      if (!Array.isArray(rawWords)) {
        issues.push({
          severity: 'ERROR',
          code: 'WORD_JSON_NOT_ARRAY',
          sourcePath: wordPath,
          message: 'word.json must contain an array.',
        });
        continue;
      }

      const wordOccurrences: WordOccurrence[] = [];

      rawWords.forEach((rawWord, index) => {
        const parsed = rawWordSchema.safeParse(rawWord);
        if (!parsed.success) {
          issues.push({
            severity: 'ERROR',
            code: 'WORD_SCHEMA_INVALID',
            sourcePath: wordPath,
            message: `Word at array index ${index} is invalid.`,
            details: parsed.error.flatten(),
          });
          return;
        }

        const word = parsed.data;

        if (word.course_id !== courseFolderId || word.lesson_id !== lessonFolderId) {
          issues.push({
            severity: 'ERROR',
            code: 'WORD_RELATION_MISMATCH',
            sourcePath: wordPath,
            sourceId: word.id,
            message: `Word relation points to course=${word.course_id}, lesson=${word.lesson_id}; expected course=${courseFolderId}, lesson=${lessonFolderId}.`,
          });
        }

        if (word.pivot && (word.pivot.word_id !== word.id || word.pivot.lesson_id !== lessonFolderId)) {
          issues.push({
            severity: 'ERROR',
            code: 'WORD_PIVOT_MISMATCH',
            sourcePath: wordPath,
            sourceId: word.id,
            message: 'pivot.word_id / pivot.lesson_id is inconsistent.',
          });
        }

        if (!word.phonetic?.trim()) {
          issues.push({
            severity: 'WARNING',
            code: 'PHONETIC_MISSING',
            sourcePath: wordPath,
            sourceId: word.id,
            message: 'phonetic/romaji is missing.',
          });
        }

        const occurrence: WordOccurrence = {
          sourcePath: wordPath,
          lessonDir,
          courseFolderId,
          lessonFolderId,
          orderInLesson: index + 1,
          data: word,
        };

        const list = occurrencesByWordId.get(word.id) ?? [];
        list.push(occurrence);
        occurrencesByWordId.set(word.id, list);
        wordOccurrences.push(occurrence);

        if (word.audio) {
          audioReferences += 1;
          const media = resolveMediaUrl({
            lessonDir,
            courseFolderId,
            lessonFolderId,
            kind: 'audio',
            sourceUrl: word.audio,
            mediaBaseUrl: args.mediaBaseUrl,
          });
          if (!media.exists) {
            missingAudioFiles += 1;
            issues.push({
              severity: 'WARNING',
              code: 'AUDIO_FILE_MISSING',
              sourcePath: wordPath,
              sourceId: word.id,
              message: `Audio file not found locally: ${media.fileName ?? word.audio}`,
            });
          }
        }

        if (word.picture) {
          pictureReferences += 1;
          const media = resolveMediaUrl({
            lessonDir,
            courseFolderId,
            lessonFolderId,
            kind: 'picture',
            sourceUrl: word.picture,
            mediaBaseUrl: args.mediaBaseUrl,
          });
          if (!media.exists) {
            missingPictureFiles += 1;
            issues.push({
              severity: 'WARNING',
              code: 'PICTURE_FILE_MISSING',
              sourcePath: wordPath,
              sourceId: word.id,
              message: `Picture file not found locally: ${media.fileName ?? word.picture}`,
            });
          }
        }
      });

      lessons.push({
        sourcePath: lessonPath,
        lessonDir,
        courseFolderId,
        lessonFolderId,
        lesson,
        words: wordOccurrences,
      });
    }
  }

  const canonicalWords = new Map<number, WordOccurrence>();
  const lessonWordKeys = new Set<string>();
  for (const lesson of lessons) {
    for (const occurrence of lesson.words) {
      lessonWordKeys.add(`${lesson.lesson.id}:${occurrence.data.id}`);
    }
  }

  let duplicateSourceWordIds = 0;
  let conflictingSourceWordIds = 0;

  for (const [wordId, occurrences] of occurrencesByWordId.entries()) {
    if (occurrences.length > 1) duplicateSourceWordIds += 1;

    const sorted = [...occurrences].sort((a, b) => {
      const dateDiff = parseSourceTimestamp(b.data.updated_at) - parseSourceTimestamp(a.data.updated_at);
      if (dateDiff !== 0) return dateDiff;
      return a.sourcePath.localeCompare(b.sourcePath);
    });

    canonicalWords.set(wordId, sorted[0]);

    if (occurrences.length > 1) {
      const conflictFields = CONFLICT_FIELDS.filter((field) => {
        const variants = new Set(occurrences.map((item) => serializeComparable(item.data[field])));
        return variants.size > 1;
      });

      if (conflictFields.length > 0) {
        conflictingSourceWordIds += 1;
        issues.push({
          severity: 'WARNING',
          code: 'WORD_VARIANT_CONFLICT',
          sourcePath: sorted[0].sourcePath,
          sourceId: wordId,
          message: `Canonical word chosen by latest updated_at. Conflicting fields: ${conflictFields.join(', ')}.`,
          details: {
            occurrences: occurrences.map((item) => item.sourcePath),
            conflictFields,
          },
        });
      }
    }
  }

  return {
    catalog,
    lessons,
    canonicalWords,
    issues,
    summary: {
      courses: courseFolders.length,
      lessons: lessons.length,
      wordOccurrences: lessons.reduce((sum, item) => sum + item.words.length, 0),
      normalizedLessonWordLinks: lessonWordKeys.size,
      duplicateLessonWordOccurrences:
        lessons.reduce((sum, item) => sum + item.words.length, 0) - lessonWordKeys.size,
      uniqueSourceWordIds: canonicalWords.size,
      duplicateSourceWordIds,
      conflictingSourceWordIds,
      audioReferences,
      pictureReferences,
      missingAudioFiles,
      missingPictureFiles,
    },
  };
}

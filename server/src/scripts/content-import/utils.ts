import fs from 'node:fs';
import path from 'node:path';

export function nonBlank(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function fileNameFromUrl(value: string | null | undefined): string | null {
  const raw = nonBlank(value);
  if (!raw) return null;

  try {
    const parsed = new URL(raw);
    const name = parsed.pathname.split('/').filter(Boolean).at(-1);
    return name ? decodeURIComponent(name) : null;
  } catch {
    const name = raw.replaceAll('\\', '/').split('/').filter(Boolean).at(-1);
    return name ? decodeURIComponent(name) : null;
  }
}

export function resolveMediaUrl(args: {
  lessonDir: string;
  courseFolderId: number;
  lessonFolderId: number;
  kind: 'audio' | 'picture';
  sourceUrl: string | null | undefined;
  mediaBaseUrl: string;
}): { url: string | null; exists: boolean; fileName: string | null } {
  const fileName = fileNameFromUrl(args.sourceUrl);
  if (!fileName) return { url: null, exists: false, fileName: null };

  const localPath = path.join(args.lessonDir, args.kind, fileName);
  const exists = fs.existsSync(localPath);
  if (!exists) return { url: null, exists: false, fileName };

  const encodedName = encodeURIComponent(fileName).replaceAll('%2F', '/');
  const base = args.mediaBaseUrl.replace(/\/$/, '');

  return {
    exists: true,
    fileName,
    url: `${base}/${args.courseFolderId}/${args.lessonFolderId}/${args.kind}/${encodedName}`,
  };
}

export function searchFormsFromWord(word: {
  content?: unknown;
  kanji?: unknown;
  phonetic?: unknown;
  other_form?: unknown;
  multi_answer?: unknown;
}): string[] {
  const values: string[] = [];
  const keys = ['content', 'kanji', 'phonetic', 'other_form'] as const;

  for (const key of keys) {
    const value = nonBlank(word[key]);
    if (value) values.push(value);
  }

  const multiAnswer = nonBlank(word.multi_answer);
  if (multiAnswer) {
    for (const item of multiAnswer.split(';')) {
      const value = nonBlank(item);
      if (value) values.push(value);
    }
  }

  return [...new Set(values)];
}

export function parseSourceTimestamp(value: string | null | undefined): number {
  const text = nonBlank(value);
  if (!text) return 0;
  const normalized = text.includes('T') ? text : text.replace(' ', 'T');
  const timestamp = Date.parse(normalized);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }

  return out;
}

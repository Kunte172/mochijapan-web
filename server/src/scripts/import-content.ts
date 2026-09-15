import 'dotenv/config';

import fs from 'node:fs';
import path from 'node:path';

import { prisma } from '../lib/prisma.js';
import { importDataset } from './content-import/importer.js';
import { scanDataset } from './content-import/scanner.js';

function resolveFromServer(value: string): string {
  return path.resolve(process.cwd(), value);
}

const apply = process.argv.includes('--apply');
const publish = process.argv.includes('--publish');

const dataDir = resolveFromServer(process.env.CONTENT_DATA_DIR ?? './data/raw/courses');
const catalogPath = resolveFromServer(
  process.env.CONTENT_CATALOG_PATH ?? './data/import/course-catalog.json',
);
const reportPath = resolveFromServer(
  process.env.CONTENT_REPORT_PATH ?? './data/reports/content-import-report.json',
);
const mediaBaseUrl =
  process.env.MEDIA_BASE_URL ??
  'https://raw.githubusercontent.com/Kunte172/mochijapan-media/main/courses';

async function main() {
  console.log('MochiJapan Content Import — Day 6');
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`Publish status: ${publish ? 'PUBLISHED' : 'DRAFT'}`);
  console.log(`Dataset: ${dataDir}`);

  const scan = scanDataset({ dataDir, catalogPath, mediaBaseUrl });

  const errors = scan.issues.filter((item) => item.severity === 'ERROR');
  const warnings = scan.issues.filter((item) => item.severity === 'WARNING');

  const report = {
    generatedAt: new Date().toISOString(),
    mode: apply ? 'APPLY' : 'DRY_RUN',
    targetStatus: publish ? 'PUBLISHED' : 'DRAFT',
    summary: scan.summary,
    issueSummary: {
      errors: errors.length,
      warnings: warnings.length,
    },
    issues: scan.issues,
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('\nValidation summary');
  console.table({
    courses: scan.summary.courses,
    lessons: scan.summary.lessons,
    wordOccurrences: scan.summary.wordOccurrences,
    normalizedLessonWordLinks: scan.summary.normalizedLessonWordLinks,
    duplicateLessonWordOccurrences: scan.summary.duplicateLessonWordOccurrences,
    uniqueSourceWordIds: scan.summary.uniqueSourceWordIds,
    duplicateSourceWordIds: scan.summary.duplicateSourceWordIds,
    conflictingSourceWordIds: scan.summary.conflictingSourceWordIds,
    missingAudioFiles: scan.summary.missingAudioFiles,
    missingPictureFiles: scan.summary.missingPictureFiles,
    errors: errors.length,
    warnings: warnings.length,
  });
  console.log(`Report written to: ${reportPath}`);

  if (errors.length > 0) {
    throw new Error(`Import blocked because validation found ${errors.length} error(s).`);
  }

  if (!apply) {
    console.log('\nDry run completed. Database was NOT modified.');
    return;
  }

  console.log('\nApplying content to PostgreSQL...');
  const counts = await importDataset({ scan, publish, mediaBaseUrl });

  console.log('\nDatabase counts after import');
  console.table(counts);

  const expected = {
    courses: 11,
    lessons: 651,
    words: 6044,
    lessonWords: 8061,
    examples: 6044,
  };

  const mismatches = Object.entries(expected).filter(
    ([key, value]) => counts[key as keyof typeof counts] !== value,
  );

  if (mismatches.length > 0) {
    console.warn('\nWARNING: Database counts differ from the audited baseline:');
    for (const [key, expectedValue] of mismatches) {
      console.warn(`- ${key}: expected ${expectedValue}, got ${counts[key as keyof typeof counts]}`);
    }
  } else {
    console.log('\nAll imported counts match the audited baseline.');
  }
}

main()
  .catch((error) => {
    console.error('\nContent import failed:');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

-- CreateEnum
CREATE TYPE "JlptLevel" AS ENUM ('N5', 'N4', 'N3', 'N2', 'N1');

-- CreateTable
CREATE TABLE "GrammarPoint" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "meaningVi" TEXT NOT NULL,
    "meaningEn" TEXT,
    "explanationVi" TEXT,
    "explanationEn" TEXT,
    "formation" TEXT,
    "jlptLevel" "JlptLevel",
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" TEXT,
    "sourceMetadata" JSONB,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrammarPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarExample" (
    "id" TEXT NOT NULL,
    "grammarPointId" TEXT NOT NULL,
    "japanese" TEXT NOT NULL,
    "vietnamese" TEXT,
    "english" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrammarExample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kanji" (
    "id" TEXT NOT NULL,
    "character" TEXT NOT NULL,
    "meaningsVi" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "meaningsEn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "onyomi" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "kunyomi" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nanori" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "jlptLevel" "JlptLevel",
    "grade" INTEGER,
    "strokeCount" INTEGER,
    "radical" TEXT,
    "frequency" INTEGER,
    "source" TEXT,
    "sourceMetadata" JSONB,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kanji_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KanjiWord" (
    "kanjiId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,

    CONSTRAINT "KanjiWord_pkey" PRIMARY KEY ("kanjiId","wordId")
);

-- CreateIndex
CREATE UNIQUE INDEX "GrammarPoint_code_key" ON "GrammarPoint"("code");

-- CreateIndex
CREATE INDEX "GrammarPoint_jlptLevel_status_idx" ON "GrammarPoint"("jlptLevel", "status");

-- CreateIndex
CREATE INDEX "GrammarPoint_pattern_idx" ON "GrammarPoint"("pattern");

-- CreateIndex
CREATE INDEX "GrammarExample_grammarPointId_sortOrder_idx" ON "GrammarExample"("grammarPointId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Kanji_character_key" ON "Kanji"("character");

-- CreateIndex
CREATE INDEX "Kanji_jlptLevel_status_idx" ON "Kanji"("jlptLevel", "status");

-- CreateIndex
CREATE INDEX "Kanji_strokeCount_idx" ON "Kanji"("strokeCount");

-- CreateIndex
CREATE INDEX "KanjiWord_wordId_idx" ON "KanjiWord"("wordId");

-- AddForeignKey
ALTER TABLE "GrammarExample" ADD CONSTRAINT "GrammarExample_grammarPointId_fkey" FOREIGN KEY ("grammarPointId") REFERENCES "GrammarPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanjiWord" ADD CONSTRAINT "KanjiWord_kanjiId_fkey" FOREIGN KEY ("kanjiId") REFERENCES "Kanji"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanjiWord" ADD CONSTRAINT "KanjiWord_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

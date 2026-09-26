-- CreateTable
CREATE TABLE "UserGrammarState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grammarPointId" TEXT NOT NULL,
    "masteryLevel" INTEGER NOT NULL DEFAULT 0,
    "memoryStrength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "firstLearnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "lapseCount" INTEGER NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTimeMs" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGrammarState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserKanjiState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kanjiId" TEXT NOT NULL,
    "masteryLevel" INTEGER NOT NULL DEFAULT 0,
    "memoryStrength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "firstLearnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "incorrectCount" INTEGER NOT NULL DEFAULT 0,
    "lapseCount" INTEGER NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTimeMs" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserKanjiState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarReviewEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grammarPointId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "rating" "ReviewRating" NOT NULL,
    "responseTimeMs" INTEGER,
    "previousMasteryLevel" INTEGER,
    "newMasteryLevel" INTEGER,
    "previousMemoryStrength" DOUBLE PRECISION,
    "newMemoryStrength" DOUBLE PRECISION,
    "idempotencyKey" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrammarReviewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KanjiReviewEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kanjiId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "rating" "ReviewRating" NOT NULL,
    "responseTimeMs" INTEGER,
    "previousMasteryLevel" INTEGER,
    "newMasteryLevel" INTEGER,
    "previousMemoryStrength" DOUBLE PRECISION,
    "newMemoryStrength" DOUBLE PRECISION,
    "idempotencyKey" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KanjiReviewEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserGrammarState_grammarPointId_idx" ON "UserGrammarState"("grammarPointId");

-- CreateIndex
CREATE INDEX "UserGrammarState_userId_nextReviewAt_idx" ON "UserGrammarState"("userId", "nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserGrammarState_userId_grammarPointId_key" ON "UserGrammarState"("userId", "grammarPointId");

-- CreateIndex
CREATE INDEX "UserKanjiState_kanjiId_idx" ON "UserKanjiState"("kanjiId");

-- CreateIndex
CREATE INDEX "UserKanjiState_userId_nextReviewAt_idx" ON "UserKanjiState"("userId", "nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserKanjiState_userId_kanjiId_key" ON "UserKanjiState"("userId", "kanjiId");

-- CreateIndex
CREATE UNIQUE INDEX "GrammarReviewEvent_idempotencyKey_key" ON "GrammarReviewEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "GrammarReviewEvent_userId_reviewedAt_idx" ON "GrammarReviewEvent"("userId", "reviewedAt");

-- CreateIndex
CREATE INDEX "GrammarReviewEvent_grammarPointId_reviewedAt_idx" ON "GrammarReviewEvent"("grammarPointId", "reviewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "KanjiReviewEvent_idempotencyKey_key" ON "KanjiReviewEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "KanjiReviewEvent_userId_reviewedAt_idx" ON "KanjiReviewEvent"("userId", "reviewedAt");

-- CreateIndex
CREATE INDEX "KanjiReviewEvent_kanjiId_reviewedAt_idx" ON "KanjiReviewEvent"("kanjiId", "reviewedAt");

-- AddForeignKey
ALTER TABLE "UserGrammarState" ADD CONSTRAINT "UserGrammarState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGrammarState" ADD CONSTRAINT "UserGrammarState_grammarPointId_fkey" FOREIGN KEY ("grammarPointId") REFERENCES "GrammarPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserKanjiState" ADD CONSTRAINT "UserKanjiState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserKanjiState" ADD CONSTRAINT "UserKanjiState_kanjiId_fkey" FOREIGN KEY ("kanjiId") REFERENCES "Kanji"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarReviewEvent" ADD CONSTRAINT "GrammarReviewEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarReviewEvent" ADD CONSTRAINT "GrammarReviewEvent_grammarPointId_fkey" FOREIGN KEY ("grammarPointId") REFERENCES "GrammarPoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanjiReviewEvent" ADD CONSTRAINT "KanjiReviewEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanjiReviewEvent" ADD CONSTRAINT "KanjiReviewEvent_kanjiId_fkey" FOREIGN KEY ("kanjiId") REFERENCES "Kanji"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "StudySessionItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "scheduledFor" TIMESTAMP(3),
    "priorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudySessionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudySessionItem_wordId_idx" ON "StudySessionItem"("wordId");

-- CreateIndex
CREATE INDEX "StudySessionItem_sessionId_answeredAt_idx" ON "StudySessionItem"("sessionId", "answeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudySessionItem_sessionId_wordId_key" ON "StudySessionItem"("sessionId", "wordId");

-- CreateIndex
CREATE UNIQUE INDEX "StudySessionItem_sessionId_position_key" ON "StudySessionItem"("sessionId", "position");

-- AddForeignKey
ALTER TABLE "StudySessionItem" ADD CONSTRAINT "StudySessionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySessionItem" ADD CONSTRAINT "StudySessionItem_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

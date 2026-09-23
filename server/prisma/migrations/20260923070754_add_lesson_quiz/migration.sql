-- CreateEnum
CREATE TYPE "QuizAttemptStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "QuizQuestionType" AS ENUM ('WORD_TO_MEANING', 'MEANING_TO_WORD', 'READING_TO_MEANING', 'AUDIO_TO_MEANING');

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "QuizAttemptStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttemptItem" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "questionType" "QuizQuestionType" NOT NULL,
    "optionWordIds" TEXT[],
    "selectedWordId" TEXT,
    "isCorrect" BOOLEAN,
    "responseTimeMs" INTEGER,
    "answerIdempotencyKey" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizAttemptItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuizAttempt_sessionId_key" ON "QuizAttempt"("sessionId");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_status_idx" ON "QuizAttempt"("userId", "status");

-- CreateIndex
CREATE INDEX "QuizAttempt_lessonId_startedAt_idx" ON "QuizAttempt"("lessonId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAttemptItem_answerIdempotencyKey_key" ON "QuizAttemptItem"("answerIdempotencyKey");

-- CreateIndex
CREATE INDEX "QuizAttemptItem_wordId_idx" ON "QuizAttemptItem"("wordId");

-- CreateIndex
CREATE INDEX "QuizAttemptItem_attemptId_answeredAt_idx" ON "QuizAttemptItem"("attemptId", "answeredAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAttemptItem_attemptId_position_key" ON "QuizAttemptItem"("attemptId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAttemptItem_attemptId_wordId_key" ON "QuizAttemptItem"("attemptId", "wordId");

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttemptItem" ADD CONSTRAINT "QuizAttemptItem_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttemptItem" ADD CONSTRAINT "QuizAttemptItem_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[sourceKey]` on the table `ExampleSentence` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "outcomeEn" TEXT,
ADD COLUMN     "outcomeVi" TEXT,
ADD COLUMN     "sourceMetadata" JSONB;

-- AlterTable
ALTER TABLE "ExampleSentence" ADD COLUMN     "sourceKey" TEXT;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "sourceMetadata" JSONB;

-- AlterTable
ALTER TABLE "Word" ADD COLUMN     "otherForm" TEXT,
ADD COLUMN     "searchForms" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sourceMetadata" JSONB,
ADD COLUMN     "sourceReview" INTEGER,
ADD COLUMN     "sourceWmId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "ExampleSentence_sourceKey_key" ON "ExampleSentence"("sourceKey");

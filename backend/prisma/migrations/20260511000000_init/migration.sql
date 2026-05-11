-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('interviewing', 'ready_to_report', 'completed');

-- CreateTable
CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "status" "SessionStatus" NOT NULL DEFAULT 'interviewing',
  "currentQuestionId" TEXT,
  "questionCount" INTEGER NOT NULL DEFAULT 0,
  "canGenerateReport" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "bankQuestionId" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "questionText" TEXT NOT NULL,
  "optionsJson" JSONB NOT NULL,
  "orderNo" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "selectedOptionId" TEXT NOT NULL,
  "selectedOptionText" TEXT NOT NULL,
  "selectedTags" JSONB NOT NULL,
  "nextHints" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "contentJson" JSONB NOT NULL,
  "agentContext" TEXT NOT NULL,
  "skillMarkdown" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Question_sessionId_idx" ON "Question"("sessionId");

-- CreateIndex
CREATE INDEX "Answer_sessionId_idx" ON "Answer"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_sessionId_questionId_key" ON "Answer"("sessionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_sessionId_key" ON "Report"("sessionId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

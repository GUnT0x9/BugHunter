CREATE TYPE "ExecutionKind" AS ENUM ('RUN', 'SUBMIT');
CREATE TYPE "ExecutionStatus" AS ENUM (
    'QUEUED',
    'RUNNING',
    'SUCCEEDED',
    'FAILED',
    'ERROR',
    'TIMED_OUT'
);

CREATE TABLE "Execution" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "submissionId" TEXT,
    "kind" "ExecutionKind" NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'QUEUED',
    "code" TEXT NOT NULL,
    "activeUserId" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "enqueuedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "resultJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Execution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Execution_submissionId_key" ON "Execution"("submissionId");
CREATE UNIQUE INDEX "Execution_activeUserId_key" ON "Execution"("activeUserId");
CREATE INDEX "Execution_status_enqueuedAt_idx" ON "Execution"("status", "enqueuedAt");
CREATE INDEX "Execution_userId_createdAt_idx" ON "Execution"("userId", "createdAt");

ALTER TABLE "Execution"
ADD CONSTRAINT "Execution_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Execution"
ADD CONSTRAINT "Execution_missionId_fkey"
FOREIGN KEY ("missionId") REFERENCES "Mission"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Execution"
ADD CONSTRAINT "Execution_submissionId_fkey"
FOREIGN KEY ("submissionId") REFERENCES "Submission"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

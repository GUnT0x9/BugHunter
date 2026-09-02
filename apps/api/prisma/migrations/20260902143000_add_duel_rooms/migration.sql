CREATE TYPE "DuelStatus" AS ENUM ('WAITING', 'ACTIVE', 'FINISHED', 'CANCELLED');

CREATE TABLE "DuelRoom" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "status" "DuelStatus" NOT NULL DEFAULT 'WAITING',
    "winnerId" TEXT,
    "startedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DuelRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DuelParticipant" (
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptBase" INTEGER NOT NULL DEFAULT 0,
    "hintBase" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DuelParticipant_pkey" PRIMARY KEY ("roomId","userId")
);

CREATE UNIQUE INDEX "DuelRoom_code_key" ON "DuelRoom"("code");
CREATE INDEX "DuelRoom_status_expiresAt_idx" ON "DuelRoom"("status", "expiresAt");
CREATE INDEX "DuelParticipant_userId_joinedAt_idx" ON "DuelParticipant"("userId", "joinedAt");
ALTER TABLE "DuelRoom" ADD CONSTRAINT "DuelRoom_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DuelRoom" ADD CONSTRAINT "DuelRoom_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DuelParticipant" ADD CONSTRAINT "DuelParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "DuelRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DuelParticipant" ADD CONSTRAINT "DuelParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

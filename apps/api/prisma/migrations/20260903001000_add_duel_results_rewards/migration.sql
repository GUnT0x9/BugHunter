ALTER TABLE "DuelRoom" ADD COLUMN "rewardXp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DuelParticipant" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DuelParticipant" ADD COLUMN "hintUsed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DuelParticipant" ADD COLUMN "solvedAt" TIMESTAMP(3);

CREATE TABLE "DuelReward" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DuelReward_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DuelReward_roomId_key" ON "DuelReward"("roomId");
CREATE INDEX "DuelReward_userId_createdAt_idx" ON "DuelReward"("userId", "createdAt");
ALTER TABLE "DuelReward" ADD CONSTRAINT "DuelReward_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "DuelRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DuelReward" ADD CONSTRAINT "DuelReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

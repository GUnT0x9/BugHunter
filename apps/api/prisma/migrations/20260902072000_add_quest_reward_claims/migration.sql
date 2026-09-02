CREATE TABLE IF NOT EXISTS "QuestRewardClaim" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "questKey" TEXT NOT NULL,
  "periodKey" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestRewardClaim_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestRewardClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "QuestRewardClaim_userId_questKey_periodKey_key"
  ON "QuestRewardClaim"("userId", "questKey", "periodKey");
CREATE INDEX IF NOT EXISTS "QuestRewardClaim_userId_claimedAt_idx"
  ON "QuestRewardClaim"("userId", "claimedAt");

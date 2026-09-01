CREATE INDEX "Submission_userId_idx" ON "Submission"("userId");
CREATE INDEX "Submission_missionId_idx" ON "Submission"("missionId");
CREATE INDEX "MissionProgress_userId_completedAt_updatedAt_idx"
ON "MissionProgress"("userId", "completedAt", "updatedAt");

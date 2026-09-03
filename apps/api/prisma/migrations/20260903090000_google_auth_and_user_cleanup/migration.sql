ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "googleSub" TEXT;
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");

-- Requested production reset: retain the named primary account and every administrator.
DELETE FROM "User"
WHERE "username" <> '123' AND "role" <> 'ADMIN';

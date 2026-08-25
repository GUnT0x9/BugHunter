import type { Prisma } from '@prisma/client';

function seoulDate(now: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '01';
  return new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00.000Z`);
}

export async function awardFirstCompletion(
  tx: Prisma.TransactionClient,
  userId: string,
  missionId: string,
): Promise<{ awardedXp: number; completed: boolean }> {
  const mission = await tx.mission.findUniqueOrThrow({
    where: { id: missionId },
    select: { baseXp: true, bugTypeId: true },
  });
  const progress = await tx.missionProgress.findUnique({
    where: { userId_missionId: { userId, missionId } },
  });
  if (progress?.completedAt) return { awardedXp: 0, completed: false };
  const awardedXp =
    mission.baseXp +
    (progress?.highestHint === 0 ? 30 : 0) +
    ((progress?.attempts ?? 1) === 1 ? 20 : 0);
  const now = new Date();
  await tx.missionProgress.upsert({
    where: { userId_missionId: { userId, missionId } },
    create: { userId, missionId, completedAt: now, attempts: 1 },
    update: { completedAt: now },
  });
  await tx.xpEvent.create({ data: { userId, missionId, amount: awardedXp } });
  await tx.user.update({ where: { id: userId }, data: { totalXp: { increment: awardedXp } } });
  await tx.userBugDex.upsert({
    where: { userId_bugTypeId: { userId, bugTypeId: mission.bugTypeId } },
    create: { userId, bugTypeId: mission.bugTypeId },
    update: { discoveredCount: { increment: 1 } },
  });
  const date = seoulDate(now);
  await tx.learningDay.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, completedAt: now },
    update: { completedAt: now },
  });
  return { awardedXp, completed: true };
}

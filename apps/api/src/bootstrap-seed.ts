import { missions } from '@bughunter/content';
import { PrismaClient, UserRole } from '@prisma/client';
import { seedAdmin, seedContent } from './seed.js';

export interface BootstrapSeedPlan {
  seedContent: boolean;
  seedAdmin: boolean;
}

export function getBootstrapSeedPlan(
  seededMissionCount: number,
  adminCount: number,
): BootstrapSeedPlan {
  return {
    seedContent: seededMissionCount < missions.length,
    seedAdmin: adminCount === 0,
  };
}

export async function ensureBootstrapData(prisma: PrismaClient): Promise<BootstrapSeedPlan> {
  const [seededMissionCount, adminCount] = await Promise.all([
    prisma.mission.count({
      where: { slug: { in: missions.map((mission) => mission.slug) } },
    }),
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
  ]);
  const plan = getBootstrapSeedPlan(seededMissionCount, adminCount);

  if (plan.seedContent) await seedContent(prisma);
  if (plan.seedAdmin) await seedAdmin(prisma);

  return plan;
}

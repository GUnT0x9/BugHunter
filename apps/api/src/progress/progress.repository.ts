import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service.js';

function currentSeoulDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/\//g, '-');
}

function calculateStreak(dates: Date[]): number {
  const days = new Set(dates.map((date) => date.toISOString().slice(0, 10)));
  const cursor = new Date(`${currentSeoulDate()}T00:00:00.000Z`);
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

@Injectable()
export class ProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(userId: string) {
    const [user, completedCount, currentProgress, fallbackProgress, days] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { totalXp: true } }),
      this.prisma.missionProgress.count({ where: { userId, completedAt: { not: null } } }),
      this.prisma.missionProgress.findFirst({
        where: { userId, completedAt: null },
        select: {
          mission: {
            select: {
              id: true,
              title: true,
              chapter: { select: { title: true, sortOrder: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.missionProgress.findFirst({
        where: { userId, completedAt: { not: null } },
        select: {
          mission: {
            select: {
              id: true,
              title: true,
              chapter: { select: { title: true, sortOrder: true } },
            },
          },
        },
        orderBy: { updatedAt: 'asc' },
      }),
      this.prisma.learningDay.findMany({
        where: { userId },
        select: { date: true },
        orderBy: { date: 'desc' },
      }),
    ]);
    const current = currentProgress?.mission ?? fallbackProgress?.mission ?? null;
    return {
      totalXp: user.totalXp,
      level: Math.floor(user.totalXp / 1_000) + 1,
      xpIntoLevel: user.totalXp % 1_000,
      xpForNextLevel: 1_000,
      bugsFixed: completedCount,
      streak: calculateStreak(days.map((day) => day.date)),
      continueMission: current
        ? {
            id: current.id,
            title: current.title,
            chapterTitle: current.chapter.title,
            chapterOrder: current.chapter.sortOrder,
          }
        : null,
    };
  }

  async bugdex(userId: string) {
    return this.prisma.userBugDex.findMany({
      where: { userId },
      include: { bugType: true },
      orderBy: { firstDiscoveredAt: 'asc' },
    });
  }

  async statistics(userId: string) {
    const [completedCount, progressTotals, submissionTotals, bugdex] = await Promise.all([
      this.prisma.missionProgress.count({ where: { userId, completedAt: { not: null } } }),
      this.prisma.missionProgress.aggregate({
        where: { userId },
        _sum: { attempts: true },
      }),
      this.prisma.submission.aggregate({
        where: { userId },
        _count: { _all: true },
        _sum: { executionTimeMs: true },
      }),
      this.prisma.userBugDex.findMany({
        where: { userId },
        select: { discoveredCount: true, bugType: { select: { name: true } } },
      }),
    ]);
    const totalAttempts = progressTotals._sum.attempts ?? 0;
    return {
      solvedCount: completedCount,
      totalSubmissions: submissionTotals._count._all,
      averageAttempts: completedCount ? Number((totalAttempts / completedCount).toFixed(1)) : 0,
      executionTimeMs: submissionTotals._sum.executionTimeMs ?? 0,
      bugSkills: bugdex.map((entry) => ({
        name: entry.bugType.name,
        fixedCount: entry.discoveredCount,
      })),
    };
  }

  async profileSummary(userId: string) {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - 83);
    const [user, days, recentActivity, completedCount, progressTotals, submissionTotals] =
      await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { createdAt: true } }),
      this.prisma.learningDay.findMany({
        where: { userId, date: { gte: since } },
        select: { date: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.missionProgress.findMany({
        where: { userId, completedAt: { not: null } },
        select: {
          missionId: true,
          completedAt: true,
          mission: {
            select: { title: true, baseXp: true, bugType: { select: { name: true } } },
          },
        },
        orderBy: { completedAt: 'desc' },
        take: 5,
      }),
      this.prisma.missionProgress.count({ where: { userId, completedAt: { not: null } } }),
      this.prisma.missionProgress.aggregate({ where: { userId }, _sum: { attempts: true } }),
      this.prisma.submission.aggregate({
        where: { userId },
        _count: { _all: true, executionTimeMs: true },
        _avg: { executionTimeMs: true },
      }),
    ]);
    return {
      joinedAt: user.createdAt.toISOString(),
      activityDays: days.map((day) => ({ date: day.date.toISOString().slice(0, 10), count: 1 })),
      recentActivity: recentActivity.map((item) => ({
        id: item.missionId,
        title: item.mission.title,
        detail: `${item.mission.bugType.name} 해결`,
        xp: item.mission.baseXp,
        occurredAt: item.completedAt!.toISOString(),
      })),
      solvedCount: completedCount,
      totalSubmissions: submissionTotals._count._all,
      averageAttempts: completedCount
        ? Number(((progressTotals._sum.attempts ?? 0) / completedCount).toFixed(1))
        : 0,
      averageExecutionTimeMs: Math.round(submissionTotals._avg.executionTimeMs ?? 0),
    };
  }
}

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
    const [user, progress, days] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { totalXp: true } }),
      this.prisma.missionProgress.findMany({
        where: { userId },
        include: { mission: { include: { chapter: true } } },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.learningDay.findMany({
        where: { userId },
        select: { date: true },
        orderBy: { date: 'desc' },
      }),
    ]);
    const completed = progress.filter((item) => item.completedAt);
    const current =
      progress.find((item) => !item.completedAt)?.mission ?? completed.at(-1)?.mission ?? null;
    return {
      totalXp: user.totalXp,
      level: Math.floor(user.totalXp / 1_000) + 1,
      xpIntoLevel: user.totalXp % 1_000,
      xpForNextLevel: 1_000,
      bugsFixed: completed.length,
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
    const [progress, submissions, bugdex] = await Promise.all([
      this.prisma.missionProgress.findMany({
        where: { userId },
        include: { mission: { include: { bugType: true } } },
      }),
      this.prisma.submission.findMany({
        where: { userId },
        select: { createdAt: true, executionTimeMs: true },
      }),
      this.prisma.userBugDex.findMany({ where: { userId }, include: { bugType: true } }),
    ]);
    const completed = progress.filter((item) => item.completedAt);
    const totalAttempts = progress.reduce((sum, item) => sum + item.attempts, 0);
    return {
      solvedCount: completed.length,
      totalSubmissions: submissions.length,
      averageAttempts: completed.length ? Number((totalAttempts / completed.length).toFixed(1)) : 0,
      executionTimeMs: submissions.reduce((sum, item) => sum + (item.executionTimeMs ?? 0), 0),
      bugSkills: bugdex.map((entry) => ({
        name: entry.bugType.name,
        fixedCount: entry.discoveredCount,
      })),
    };
  }
}

import { Injectable } from '@nestjs/common';
import { missionRating } from '@bughunter/contracts';
import { PrismaService } from '../common/prisma.service.js';
import { evaluateAchievements } from './achievement-engine.js';

export function masteryPercentage(earnedStars: number, missionCount: number): number {
  if (missionCount === 0) return 0;
  return Math.round((earnedStars / (missionCount * 3)) * 100);
}

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

function maximumStreak(dates: Date[]): number {
  const days = [...new Set(dates.map((date) => date.toISOString().slice(0, 10)))].sort();
  let longest = 0;
  let current = 0;
  let previous: Date | null = null;
  for (const day of days) {
    const date = new Date(`${day}T00:00:00.000Z`);
    current = previous && date.getTime() - previous.getTime() === 86_400_000 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = date;
  }
  return longest;
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
    return this.prisma.missionProgress
      .findMany({
        where: { userId, completedAt: { not: null } },
        select: {
          completedAt: true,
          attempts: true,
          highestHint: true,
          mission: {
            select: {
              id: true,
              title: true,
              description: true,
              difficulty: true,
              isBoss: true,
              baseXp: true,
              sortOrder: true,
              chapter: { select: { sortOrder: true, title: true } },
              bugType: { select: { slug: true, name: true } },
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      })
      .then((items) =>
        items.map((item) => ({
          ...item,
          rating: missionRating(item.attempts, item.highestHint),
        })),
      );
  }

  async mastery(userId: string) {
    const categories = await this.prisma.bugType.findMany({
      where: { missions: { some: { isPublished: true } } },
      select: {
        slug: true,
        name: true,
        missions: {
          where: { isPublished: true },
          select: {
            progress: {
              where: { userId, completedAt: { not: null } },
              select: { attempts: true, highestHint: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return categories.map((category) => {
      const ratings = category.missions.flatMap((mission) =>
        mission.progress.map((progress) => missionRating(progress.attempts, progress.highestHint)),
      );
      const earnedStars = ratings.reduce((sum, rating) => sum + rating.stars, 0);
      return {
        slug: category.slug,
        name: category.name,
        missionCount: category.missions.length,
        completedCount: ratings.length,
        earnedStars,
        totalStars: category.missions.length * 3,
        percentage: masteryPercentage(earnedStars, category.missions.length),
      };
    });
  }

  async achievements(userId: string) {
    const [user, progress, days, following, followers, mastery] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { totalXp: true } }),
      this.prisma.missionProgress.findMany({
        where: { userId, completedAt: { not: null } },
        select: {
          attempts: true,
          highestHint: true,
          completedAt: true,
          mission: {
            select: {
              isBoss: true,
              chapterId: true,
              bugType: { select: { slug: true } },
            },
          },
        },
      }),
      this.prisma.learningDay.findMany({ where: { userId }, select: { date: true } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.mastery(userId),
    ]);
    const ratings = progress.map((item) => missionRating(item.attempts, item.highestHint));
    const dailyCounts = new Map<string, number>();
    const dailyCategories = new Map<string, Set<string>>();
    for (const item of progress) {
      const key = item.completedAt!.toISOString().slice(0, 10);
      dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
      const categories = dailyCategories.get(key) ?? new Set<string>();
      categories.add(item.mission.bugType.slug);
      dailyCategories.set(key, categories);
    }
    const metrics = {
      solved: progress.length,
      stars: ratings.reduce((sum, rating) => sum + rating.stars, 0),
      perfect: ratings.filter((rating) => rating.stars === 3).length,
      noHint: ratings.filter((rating) => rating.noHint).length,
      firstTry: ratings.filter((rating) => rating.firstTry).length,
      bossSolved: progress.filter((item) => item.mission.isBoss).length,
      bossPerfect: progress.filter(
        (item) => item.mission.isBoss && missionRating(item.attempts, item.highestHint).stars === 3,
      ).length,
      maxStreak: maximumStreak(days.map((day) => day.date)),
      level: Math.floor(user.totalXp / 1_000) + 1,
      xp: user.totalXp,
      comebacks: progress.filter((item) => item.attempts > 1).length,
      dailyBest: Math.max(0, ...dailyCounts.values()),
      touchedCategories: new Set(progress.map((item) => item.mission.bugType.slug)).size,
      touchedChapters: new Set(progress.map((item) => item.mission.chapterId)).size,
      following,
      followers,
      midnight: progress.some((item) => {
        const hour = Number(
          new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Seoul',
            hour: '2-digit',
            hourCycle: 'h23',
          }).format(item.completedAt!),
        );
        return hour >= 0 && hour < 2;
      })
        ? 1
        : 0,
      seventhTry: progress.some((item) => item.attempts === 7) ? 1 : 0,
      dailyCategories: Math.max(0, ...[...dailyCategories.values()].map((set) => set.size)),
      perfectBoss: progress.some(
        (item) => item.mission.isBoss && missionRating(item.attempts, item.highestHint).stars === 3,
      )
        ? 1
        : 0,
      totalAttempts: progress.reduce((sum, item) => sum + item.attempts, 0),
    };
    const items = evaluateAchievements(
      metrics,
      mastery.map((item) => ({ slug: item.slug, name: item.name, percentage: item.percentage })),
    );
    const unlockedCount = items.filter((item) => item.unlocked).length;
    return { unlockedCount, totalCount: items.length, items };
  }

  async featuredAchievements(userId: string) {
    const { items } = await this.achievements(userId);
    return items
      .filter((item) => item.unlocked)
      .sort((left, right) => {
        const secretDifference = Number(right.secret ?? false) - Number(left.secret ?? false);
        return secretDifference || right.target - left.target;
      })
      .slice(0, 3)
      .map(({ code, group, title, description, secret, rarity }) => ({
        code,
        group,
        title,
        description,
        secret: secret ?? false,
        rarity,
      }));
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

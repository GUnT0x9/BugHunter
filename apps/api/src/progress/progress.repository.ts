import { Injectable } from '@nestjs/common';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { missionRating } from '@bughunter/contracts';
import { PrismaService } from '../common/prisma.service.js';
import { evaluateAchievements } from './achievement-engine.js';
import { questPeriods } from './quest-policy.js';

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
              submissions: {
                where: { userId, status: 'PASSED' },
                select: { createdAt: true },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
        orderBy: { completedAt: 'desc' },
      })
      .then((items) =>
        items.map((item) => ({
          ...item,
          rating: missionRating(item.attempts, item.highestHint),
          reviewAvailableAt: new Date(item.completedAt!.getTime() + 7 * 86_400_000).toISOString(),
          mastered: item.mission.submissions.some(
            (submission) =>
              submission.createdAt.getTime() >= item.completedAt!.getTime() + 7 * 86_400_000,
          ),
          mission: { ...item.mission, submissions: undefined },
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

  async quests(userId: string, now = new Date()) {
    const periods = questPeriods(now);
    const [progress, submissions, claims] = await Promise.all([
      this.prisma.missionProgress.findMany({
        where: { userId, completedAt: { gte: periods.weekly.startsAt, lt: periods.weekly.endsAt } },
        select: {
          completedAt: true,
          attempts: true,
          highestHint: true,
          mission: { select: { bugTypeId: true } },
        },
      }),
      this.prisma.submission.findMany({
        where: { userId, createdAt: { gte: periods.weekly.startsAt, lt: periods.weekly.endsAt } },
        select: { createdAt: true },
      }),
      this.prisma.questRewardClaim.findMany({
        where: { userId, periodKey: { in: [periods.daily.key, periods.weekly.key] } },
        select: { questKey: true, periodKey: true },
      }),
    ]);
    const dailyProgress = progress.filter((item) => item.completedAt! >= periods.daily.startsAt);
    const dailySubmissions = submissions.filter((item) => item.createdAt >= periods.daily.startsAt);
    const weeklyStars = progress.reduce(
      (sum, item) => sum + missionRating(item.attempts, item.highestHint).stars,
      0,
    );
    const definitions = [
      {
        key: 'DAILY_SOLVE_1',
        period: 'DAILY' as const,
        title: '오늘의 첫 수정',
        description: '문제 1개 해결',
        progress: dailyProgress.length,
        target: 1,
        rewardXp: 50,
        periodKey: periods.daily.key,
      },
      {
        key: 'DAILY_SUBMIT_3',
        period: 'DAILY' as const,
        title: '로그를 남겨라',
        description: '코드 3회 제출',
        progress: dailySubmissions.length,
        target: 3,
        rewardXp: 50,
        periodKey: periods.daily.key,
      },
      {
        key: 'DAILY_NO_HINT_1',
        period: 'DAILY' as const,
        title: '독립 조사',
        description: '힌트 없이 문제 1개 해결',
        progress: dailyProgress.filter((item) => item.highestHint === 0).length,
        target: 1,
        rewardXp: 50,
        periodKey: periods.daily.key,
      },
      {
        key: 'WEEKLY_SOLVE_5',
        period: 'WEEKLY' as const,
        title: '주간 정비',
        description: '이번 주 문제 5개 해결',
        progress: progress.length,
        target: 5,
        rewardXp: 200,
        periodKey: periods.weekly.key,
      },
      {
        key: 'WEEKLY_STARS_10',
        period: 'WEEKLY' as const,
        title: '별 수집 주간',
        description: '이번 주 별 10개 획득',
        progress: weeklyStars,
        target: 10,
        rewardXp: 200,
        periodKey: periods.weekly.key,
      },
      {
        key: 'WEEKLY_CATEGORIES_3',
        period: 'WEEKLY' as const,
        title: '영역 확장',
        description: '서로 다른 카테고리 3개 해결',
        progress: new Set(progress.map((item) => item.mission.bugTypeId)).size,
        target: 3,
        rewardXp: 200,
        periodKey: periods.weekly.key,
      },
    ];
    return {
      dailyEndsAt: periods.daily.endsAt.toISOString(),
      weeklyEndsAt: periods.weekly.endsAt.toISOString(),
      quests: definitions.map((quest) => ({
        ...quest,
        progress: Math.min(quest.progress, quest.target),
        completed: quest.progress >= quest.target,
        claimed: claims.some(
          (claim) => claim.questKey === quest.key && claim.periodKey === quest.periodKey,
        ),
      })),
    };
  }

  async claimQuest(userId: string, questKey: string) {
    const board = await this.quests(userId);
    const quest = board.quests.find((item) => item.key === questKey);
    if (!quest) throw new BadRequestException('유효하지 않은 퀘스트입니다.');
    if (!quest.completed) throw new BadRequestException('아직 완료하지 않은 퀘스트입니다.');
    if (quest.claimed) throw new ConflictException('이미 받은 퀘스트 보상입니다.');
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.questRewardClaim.create({
          data: {
            userId,
            questKey: quest.key,
            periodKey: quest.periodKey,
            amount: quest.rewardXp,
          },
        });
        await tx.user.update({
          where: { id: userId },
          data: { totalXp: { increment: quest.rewardXp } },
        });
      });
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002')
        throw new ConflictException('이미 받은 퀘스트 보상입니다.');
      throw error;
    }
    return { ok: true as const, awardedXp: quest.rewardXp };
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

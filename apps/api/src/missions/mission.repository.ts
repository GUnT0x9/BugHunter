import { Injectable, NotFoundException } from '@nestjs/common';
import type { MissionPublic, User } from '@bughunter/contracts';
import { PrismaService } from '../common/prisma.service.js';

const publicSelect = {
  id: true,
  slug: true,
  sortOrder: true,
  title: true,
  description: true,
  difficulty: true,
  isBoss: true,
  initialCode: true,
  explanation: true,
  baseXp: true,
  chapter: { select: { id: true, sortOrder: true } },
  bugType: { select: { id: true, slug: true, name: true, description: true } },
  hints: { select: { id: true, level: true, content: true }, orderBy: { level: 'asc' as const } },
  tests: {
    select: { id: true, sortOrder: true, input: true, expectedOutput: true, isHidden: true },
    orderBy: { sortOrder: 'asc' as const },
  },
  concepts: { select: { concept: { select: { name: true } } } },
} as const;

export function isMissionLocked(
  _role: User['role'] | null,
  _chapterOrder: number,
  _previousInChapterId: string | null,
  _previousChapterBossId: string | null,
  _completed: ReadonlySet<string>,
): boolean {
  return false;
}

@Injectable()
export class MissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublished() {
    return this.prisma.mission.findMany({
      where: { isPublished: true },
      select: publicSelect,
      orderBy: [{ chapter: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
  }

  findInternal(id: string) {
    return this.prisma.mission.findUnique({
      where: { id },
      include: {
        chapter: true,
        bugType: true,
        hints: { orderBy: { level: 'asc' } },
        tests: { orderBy: { sortOrder: 'asc' } },
        concepts: { include: { concept: true } },
      },
    });
  }

  async findInternalOrThrow(id: string) {
    const mission = await this.findInternal(id);
    if (!mission || !mission.isPublished)
      throw new NotFoundException('Mission을 찾을 수 없습니다.');
    return mission;
  }

  async listPublic(user: User | null): Promise<MissionPublic[]> {
    const missions = await this.findPublished();
    const progress = user
      ? await this.prisma.missionProgress.findMany({
          where: { userId: user.id },
          select: { missionId: true, completedAt: true },
        })
      : [];
    const completed = new Set(
      progress.filter((item) => item.completedAt).map((item) => item.missionId),
    );
    return missions.map((mission, index) =>
      this.toPublic(mission, completed, index, missions, user?.role ?? null),
    );
  }

  async getPublic(id: string, user: User | null): Promise<MissionPublic> {
    const mission = (await this.listPublic(user)).find((item) => item.id === id);
    if (!mission) throw new NotFoundException('Mission을 찾을 수 없습니다.');
    return mission;
  }

  async recordHint(userId: string, missionId: string, level: number): Promise<void> {
    const progress = await this.prisma.missionProgress.findUnique({
      where: { userId_missionId: { userId, missionId } },
      select: { completedAt: true, highestHint: true },
    });
    if (progress?.completedAt) return;
    await this.prisma.missionProgress.upsert({
      where: { userId_missionId: { userId, missionId } },
      create: { userId, missionId, highestHint: level },
      update: { highestHint: { set: Math.max(progress?.highestHint ?? 0, level) } },
    });
  }

  private toPublic(
    mission: Awaited<ReturnType<MissionRepository['findPublished']>>[number],
    completed: Set<string>,
    index: number,
    allMissions: Awaited<ReturnType<MissionRepository['findPublished']>>,
    role: User['role'] | null,
  ): MissionPublic {
    const previous = allMissions[index - 1];
    const previousInChapter = previous?.chapter.id === mission.chapter.id ? previous : undefined;
    const previousChapterBoss = previousInChapter ? undefined : previous;
    const isLocked = isMissionLocked(
      role,
      mission.chapter.sortOrder,
      previousInChapter?.id ?? null,
      previousChapterBoss?.id ?? null,
      completed,
    );
    return {
      id: mission.id,
      slug: mission.slug,
      chapterOrder: mission.chapter.sortOrder,
      order: mission.sortOrder,
      title: mission.title,
      description: mission.description,
      language: 'python',
      difficulty: mission.difficulty,
      isBoss: mission.isBoss,
      bugType: {
        id: mission.bugType.id,
        slug: mission.bugType.slug,
        name: mission.bugType.name,
        description: mission.bugType.description,
      },
      initialCode: mission.initialCode,
      explanation: completed.has(mission.id) ? mission.explanation : null,
      hints: mission.hints.map((hint) => ({
        id: hint.id,
        level: hint.level,
        content: hint.content,
      })),
      concepts: mission.concepts.map((item) => item.concept.name),
      visibleTests: mission.tests
        .filter((test) => !test.isHidden)
        .map((test) => ({
          id: test.id,
          order: test.sortOrder,
          input: test.input,
          expectedOutput: test.expectedOutput,
        })),
      totalTestCount: mission.tests.length,
      baseXp: mission.baseXp,
      isCompleted: completed.has(mission.id),
      isLocked,
    };
  }
}

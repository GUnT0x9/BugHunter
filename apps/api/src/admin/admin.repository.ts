import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import type { AdminMissionInput, AdminMissionPatch } from './admin-mission.schema.js';
import type { AdminSubmissionQuery } from './admin-submission.schema.js';
import { validateMissionShape, type MissionValidationReport } from './admin-validation.js';
import { PrismaService } from '../common/prisma.service.js';

const adminMissionInclude = {
  chapter: true,
  bugType: true,
  tests: { orderBy: { sortOrder: 'asc' as const } },
  hints: { orderBy: { level: 'asc' as const } },
  concepts: { include: { concept: true } },
};

function toConceptSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-');
}

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  listMissions() {
    return this.prisma.mission.findMany({
      include: adminMissionInclude,
      orderBy: [{ chapter: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });
  }

  async listSubmissionLogs(input: AdminSubmissionQuery) {
    const search = input.query || undefined;
    const where: Prisma.SubmissionWhereInput = {
      ...(input.status ? { status: input.status } : {}),
      ...(input.from || input.to
        ? {
            createdAt: {
              ...(input.from ? { gte: new Date(`${input.from}T00:00:00+09:00`) } : {}),
              ...(input.to
                ? { lt: new Date(new Date(`${input.to}T00:00:00+09:00`).getTime() + 86_400_000) }
                : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: 'insensitive' } },
              { user: { username: { contains: search, mode: 'insensitive' } } },
              { mission: { title: { contains: search, mode: 'insensitive' } } },
              { mission: { slug: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const skip = (input.page - 1) * input.limit;
    const [total, items, passed, failed, pending] = await this.prisma.$transaction([
      this.prisma.submission.count({ where }),
      this.prisma.submission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: input.limit,
        select: {
          id: true,
          status: true,
          executionTimeMs: true,
          resultJson: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, username: true } },
          mission: { select: { id: true, title: true, slug: true } },
        },
      }),
      this.prisma.submission.count({ where: { ...where, status: 'PASSED' } }),
      this.prisma.submission.count({
        where: { ...where, status: { in: ['FAILED', 'ERROR', 'TIMED_OUT'] } },
      }),
      this.prisma.submission.count({ where: { ...where, status: { in: ['QUEUED', 'RUNNING'] } } }),
    ]);
    return {
      items,
      total,
      page: input.page,
      limit: input.limit,
      pages: Math.max(1, Math.ceil(total / input.limit)),
      summary: {
        passed,
        failed,
        pending,
      },
    };
  }

  getSubmissionLog(id: string) {
    return this.prisma.submission.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        code: true,
        executionTimeMs: true,
        resultJson: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, username: true } },
        mission: { select: { id: true, title: true, slug: true } },
      },
    });
  }

  async previewMission(id: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id },
      include: adminMissionInclude,
    });
    if (!mission) throw new NotFoundException('Mission을 찾을 수 없습니다.');
    return mission;
  }

  async createMission(input: AdminMissionInput) {
    return this.prisma.$transaction(async (tx) => {
      const mission = await tx.mission.create({
        data: {
          chapterId: input.chapterId,
          bugTypeId: input.bugTypeId,
          slug: input.slug,
          sortOrder: input.sortOrder,
          title: input.title,
          description: input.description,
          difficulty: input.difficulty,
          isBoss: input.isBoss,
          initialCode: input.initialCode,
          referenceSolution: input.referenceSolution,
          explanation: input.explanation,
          baseXp: input.baseXp,
          tests: { create: input.tests.map((test, index) => ({ ...test, sortOrder: index + 1 })) },
          hints: { create: input.hints.map((content, index) => ({ content, level: index + 1 })) },
        },
      });
      await this.replaceConcepts(tx, mission.id, input.concepts);
      return mission;
    });
  }

  async createDraftMission(input: { chapterId: string; bugTypeId: string }) {
    return this.prisma.$transaction(async (tx) => {
      await Promise.all([
        tx.chapter.findUniqueOrThrow({ where: { id: input.chapterId } }),
        tx.bugType.findUniqueOrThrow({ where: { id: input.bugTypeId } }),
      ]);
      const latest = await tx.mission.aggregate({
        where: { chapterId: input.chapterId },
        _max: { sortOrder: true },
      });
      const mission = await tx.mission.create({
        data: {
          chapterId: input.chapterId,
          bugTypeId: input.bugTypeId,
          slug: `draft-${randomUUID()}`,
          sortOrder: (latest._max.sortOrder ?? 0) + 1,
          title: '새 디버깅 미션',
          description: '새 디버깅 미션의 문제 설명을 입력하세요.',
          difficulty: 1,
          isBoss: false,
          initialCode: "# 버그가 있는 초기 코드를 작성하세요.\nprint('TODO')\n",
          referenceSolution: "# 올바른 정답 코드를 작성하세요.\nprint('DONE')\n",
          explanation: '버그의 원인과 올바른 수정 원리를 설명하세요.',
          baseXp: 100,
          isPublished: false,
          tests: {
            create: [
              { sortOrder: 1, input: '', expectedOutput: 'DONE', isHidden: false },
              { sortOrder: 2, input: 'sample', expectedOutput: 'DONE', isHidden: false },
              { sortOrder: 3, input: 'hidden', expectedOutput: 'DONE', isHidden: true },
            ],
          },
          hints: {
            create: [
              { level: 1, content: '오류 메시지와 출력 결과를 먼저 확인하세요.' },
              { level: 2, content: '입력과 기대 출력의 차이를 비교하세요.' },
              { level: 3, content: '수정할 코드 위치와 관련 개념을 확인하세요.' },
            ],
          },
        },
      });
      const concept = await tx.concept.upsert({
        where: { slug: 'new-concept' },
        update: {},
        create: { slug: 'new-concept', name: '새 개념' },
      });
      await tx.missionConcept.create({ data: { missionId: mission.id, conceptId: concept.id } });
      return mission;
    });
  }

  async updateMission(id: string, input: AdminMissionPatch) {
    return this.prisma.$transaction(async (tx) => {
      await tx.mission.findUniqueOrThrow({ where: { id } });
      const mission = await tx.mission.update({
        where: { id },
        data: {
          ...(input.chapterId !== undefined ? { chapterId: input.chapterId } : {}),
          ...(input.bugTypeId !== undefined ? { bugTypeId: input.bugTypeId } : {}),
          ...(input.slug !== undefined ? { slug: input.slug } : {}),
          ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
          ...(input.isBoss !== undefined ? { isBoss: input.isBoss } : {}),
          ...(input.initialCode !== undefined ? { initialCode: input.initialCode } : {}),
          ...(input.referenceSolution !== undefined
            ? { referenceSolution: input.referenceSolution }
            : {}),
          ...(input.explanation !== undefined ? { explanation: input.explanation } : {}),
          ...(input.baseXp !== undefined ? { baseXp: input.baseXp } : {}),
        },
      });
      if (input.tests) {
        await tx.missionTestCase.deleteMany({ where: { missionId: id } });
        await tx.missionTestCase.createMany({
          data: input.tests.map((test, index) => ({
            ...test,
            missionId: id,
            sortOrder: index + 1,
          })),
        });
      }
      if (input.hints) {
        await tx.hint.deleteMany({ where: { missionId: id } });
        await tx.hint.createMany({
          data: input.hints.map((content, index) => ({ content, missionId: id, level: index + 1 })),
        });
      }
      if (input.concepts) await this.replaceConcepts(tx, id, input.concepts);
      return mission;
    });
  }

  async duplicateMission(id: string) {
    const source = await this.previewMission(id);
    return this.prisma.$transaction(async (tx) => {
      const latest = await tx.mission.aggregate({
        where: { chapterId: source.chapterId },
        _max: { sortOrder: true },
      });
      const mission = await tx.mission.create({
        data: {
          chapterId: source.chapterId,
          bugTypeId: source.bugTypeId,
          slug: `${source.slug}-copy-${Date.now()}`,
          sortOrder: (latest._max.sortOrder ?? 0) + 1,
          title: `${source.title} (copy)`,
          description: source.description,
          difficulty: source.difficulty,
          isBoss: source.isBoss,
          initialCode: source.initialCode,
          referenceSolution: source.referenceSolution,
          explanation: source.explanation,
          baseXp: source.baseXp,
          isPublished: false,
        },
      });
      await tx.missionTestCase.createMany({
        data: source.tests.map((test) => ({
          missionId: mission.id,
          sortOrder: test.sortOrder,
          input: test.input,
          expectedOutput: test.expectedOutput,
          isHidden: test.isHidden,
        })),
      });
      await tx.hint.createMany({
        data: source.hints.map((hint) => ({
          missionId: mission.id,
          level: hint.level,
          content: hint.content,
        })),
      });
      await tx.missionConcept.createMany({
        data: source.concepts.map((item) => ({ missionId: mission.id, conceptId: item.conceptId })),
      });
      return mission;
    });
  }

  async validateMission(id: string): Promise<MissionValidationReport> {
    const mission = await this.previewMission(id);
    return validateMissionShape({
      initialCode: mission.initialCode,
      referenceSolution: mission.referenceSolution,
      tests: mission.tests,
      hints: mission.hints.map((hint) => hint.content),
      concepts: mission.concepts.map((item) => item.concept.name),
    });
  }

  async publish(id: string) {
    const report = await this.validateMission(id);
    if (!report.ready) throw new BadRequestException(report.issues);
    return this.prisma.mission.update({ where: { id }, data: { isPublished: true } });
  }

  unpublish(id: string) {
    return this.prisma.mission.update({ where: { id }, data: { isPublished: false } });
  }

  deleteMission(id: string) {
    return this.prisma.mission.delete({ where: { id } });
  }

  private async replaceConcepts(
    tx: Prisma.TransactionClient,
    missionId: string,
    conceptNames: readonly string[],
  ): Promise<void> {
    await tx.missionConcept.deleteMany({ where: { missionId } });
    for (const conceptName of conceptNames) {
      const slug = toConceptSlug(conceptName);
      const concept = await tx.concept.upsert({
        where: { slug },
        update: { name: conceptName },
        create: { slug, name: conceptName },
      });
      await tx.missionConcept.create({ data: { missionId, conceptId: concept.id } });
    }
  }
}

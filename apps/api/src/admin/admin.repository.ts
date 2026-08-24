import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AdminMissionInput, AdminMissionPatch } from './admin-mission.schema.js';
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

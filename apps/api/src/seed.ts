import { bugTypes, chapters, missions } from '@bughunter/content';
import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

function toConceptSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-');
}

export async function seedContent(prisma: PrismaClient): Promise<void> {
  for (const bugType of bugTypes) {
    await prisma.bugType.upsert({
      where: { slug: bugType.slug },
      update: { name: bugType.name, description: bugType.description },
      create: bugType,
    });
  }

  for (const chapter of chapters) {
    const chapterData = {
      sortOrder: chapter.order,
      title: chapter.title,
      description: chapter.description,
    };
    await prisma.chapter.upsert({
      where: { slug: chapter.slug },
      update: chapterData,
      create: { slug: chapter.slug, ...chapterData },
    });
  }

  const [chapterRows, bugTypeRows] = await Promise.all([
    prisma.chapter.findMany({ select: { id: true, sortOrder: true } }),
    prisma.bugType.findMany({ select: { id: true, slug: true } }),
  ]);
  const chapterIdByOrder = new Map(chapterRows.map((chapter) => [chapter.sortOrder, chapter.id]));
  const bugTypeIdBySlug = new Map(bugTypeRows.map((bugType) => [bugType.slug, bugType.id]));

  const conceptNameBySlug = new Map<string, string>();
  for (const seed of missions) {
    for (const conceptName of seed.concepts) {
      conceptNameBySlug.set(toConceptSlug(conceptName), conceptName);
    }
  }
  await Promise.all(
    [...conceptNameBySlug].map(([slug, name]) =>
      prisma.concept.upsert({ where: { slug }, update: { name }, create: { slug, name } }),
    ),
  );
  const conceptRows = await prisma.concept.findMany({ select: { id: true, slug: true } });
  const conceptIdBySlug = new Map(conceptRows.map((concept) => [concept.slug, concept.id]));

  for (const seed of missions) {
    const chapterId = chapterIdByOrder.get(seed.chapterOrder);
    const bugTypeId = bugTypeIdBySlug.get(seed.bugTypeSlug);
    if (!chapterId || !bugTypeId) throw new Error(`Invalid Mission relation: ${seed.slug}`);
    await prisma.$transaction(async (tx) => {
      const missionData = {
        chapterId,
        sortOrder: seed.order,
        title: seed.title,
        description: seed.description,
        difficulty: seed.difficulty,
        isBoss: seed.isBoss,
        bugTypeId,
        initialCode: seed.initialCode,
        referenceSolution: seed.referenceSolution,
        explanation: seed.explanation,
        baseXp: seed.baseXp,
      };
      const mission = await tx.mission.upsert({
        where: { slug: seed.slug },
        update: missionData,
        create: { slug: seed.slug, ...missionData, isPublished: true },
      });
      await Promise.all([
        tx.missionTestCase.deleteMany({ where: { missionId: mission.id } }),
        tx.hint.deleteMany({ where: { missionId: mission.id } }),
        tx.missionConcept.deleteMany({ where: { missionId: mission.id } }),
      ]);
      await tx.missionTestCase.createMany({
        data: seed.tests.map(({ order, ...test }) => ({
          ...test,
          missionId: mission.id,
          sortOrder: order,
        })),
      });
      await tx.hint.createMany({
        data: seed.hints.map((content, index) => ({
          missionId: mission.id,
          level: index + 1,
          content,
        })),
      });
      const conceptIds = new Set(
        seed.concepts.map((name) => {
          const slug = toConceptSlug(name);
          const conceptId = conceptIdBySlug.get(slug);
          if (!conceptId) throw new Error(`Invalid Concept relation: ${slug}`);
          return conceptId;
        }),
      );
      await tx.missionConcept.createMany({
        data: [...conceptIds].map((conceptId) => ({ missionId: mission.id, conceptId })),
      });
    });
  }
}

export async function seedAdmin(prisma: PrismaClient): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return;
  if (adminPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters long.');
  }

  const passwordHash = await argon2.hash(adminPassword, { type: argon2.argon2id });
  const username = process.env.ADMIN_USERNAME?.trim() || 'CodeTrace Admin';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { username, passwordHash, role: UserRole.ADMIN },
    create: {
      email: adminEmail,
      username,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });
}

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  await seedContent(prisma);
  await seedAdmin(prisma);
}

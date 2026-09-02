import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../common/prisma.service.js';
import { AdminRepository } from './admin.repository.js';

describe('AdminRepository draft creation', () => {
  it('creates a private editable mission at the end of the selected chapter', async () => {
    const missionCreate = vi.fn().mockResolvedValue({ id: 'new-mission' });
    const tx = {
      chapter: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'chapter-1' }) },
      bugType: { findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'bug-type-1' }) },
      mission: {
        aggregate: vi.fn().mockResolvedValue({ _max: { sortOrder: 5 } }),
        create: missionCreate,
      },
      concept: { upsert: vi.fn().mockResolvedValue({ id: 'concept-1' }) },
      missionConcept: { create: vi.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: vi.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    const repository = new AdminRepository(prisma as unknown as PrismaService);

    await expect(
      repository.createDraftMission({ chapterId: 'chapter-1', bugTypeId: 'bug-type-1' }),
    ).resolves.toEqual({ id: 'new-mission' });

    expect(missionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        chapterId: 'chapter-1',
        bugTypeId: 'bug-type-1',
        slug: expect.stringMatching(/^draft-[a-f0-9-]+$/),
        sortOrder: 6,
        isPublished: false,
        tests: { create: expect.arrayContaining([expect.objectContaining({ isHidden: true })]) },
        hints: { create: expect.any(Array) },
      }),
    });
    expect(missionCreate.mock.calls[0]?.[0].data.hints.create).toHaveLength(3);
  });
});

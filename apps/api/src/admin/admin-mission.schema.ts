import { z } from 'zod';

export const AdminMissionSchema = z.object({
  chapterId: z.string().min(1),
  bugTypeId: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  sortOrder: z.number().int().positive(),
  title: z.string().min(2).max(120),
  description: z.string().min(10),
  difficulty: z.number().int().min(1).max(5),
  isBoss: z.boolean().default(false),
  initialCode: z
    .string()
    .min(1)
    .max(64 * 1024),
  referenceSolution: z
    .string()
    .min(1)
    .max(64 * 1024),
  explanation: z.string().min(10),
  baseXp: z.number().int().positive(),
  tests: z
    .array(z.object({ input: z.string(), expectedOutput: z.string(), isHidden: z.boolean() }))
    .min(3),
  hints: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]),
  concepts: z.array(z.string().min(1)).min(1),
});

export type AdminMissionInput = z.infer<typeof AdminMissionSchema>;
export const AdminMissionPatchSchema = AdminMissionSchema.partial();
export type AdminMissionPatch = z.infer<typeof AdminMissionPatchSchema>;

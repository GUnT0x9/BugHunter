import { z } from 'zod';

export const AdminSubmissionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(10).max(100).default(30),
  status: z.enum(['QUEUED', 'RUNNING', 'PASSED', 'FAILED', 'ERROR', 'TIMED_OUT']).optional(),
  query: z.string().trim().max(100).optional(),
});

export type AdminSubmissionQuery = z.infer<typeof AdminSubmissionQuerySchema>;

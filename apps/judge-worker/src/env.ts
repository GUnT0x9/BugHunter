import { z } from 'zod';
import { loadEnvFile } from 'node:process';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JUDGE_IMAGE: z.string().default('python:3.12-alpine'),
});

export type WorkerEnv = z.infer<typeof EnvSchema>;

export function loadWorkerEnv(): WorkerEnv {
  if (!process.env.DATABASE_URL || !process.env.REDIS_URL) {
    for (const path of ['.env', '../api/.env']) {
      try {
        loadEnvFile(path);
        break;
      } catch (error: unknown) {
        if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
      }
    }
  }
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success)
    throw new Error(
      `Invalid worker environment: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`,
    );
  return parsed.data;
}

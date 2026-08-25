import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  SESSION_COOKIE_SAME_SITE: z.enum(['lax', 'none']).default('lax'),
  JUDGE_PROVIDER: z.enum(['docker', 'judge0', 'code_compiler']).default('docker'),
  JUDGE0_API_URL: z.string().url().default('https://ce.judge0.com'),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`,
    );
  }
  return parsed.data;
}

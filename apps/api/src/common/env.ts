import { z } from 'zod';

const DEFAULT_WEB_ORIGINS = [
  'https://debugrove.vercel.app',
  'https://bughunter-web.vercel.app',
  'https://codetrace-lab.vercel.app',
].join(',');

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  WEB_ORIGINS: z.string().default(DEFAULT_WEB_ORIGINS),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  SESSION_COOKIE_SAME_SITE: z.enum(['lax', 'none']).default('lax'),
  JUDGE_PROVIDER: z.enum(['docker', 'judge0', 'code_compiler']).default('docker'),
  JUDGE0_API_URL: z.string().url().default('https://ce.judge0.com'),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function getTrustedWebOrigins(env: { WEB_ORIGIN: string; WEB_ORIGINS?: string }): string[] {
  const configured = [env.WEB_ORIGIN, ...(env.WEB_ORIGINS?.split(',') ?? [])]
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(configured.map((value) => new URL(value).origin))];
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(
      `Invalid environment: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`,
    );
  }
  return parsed.data;
}

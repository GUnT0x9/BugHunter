import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { loadEnvFile } from 'node:process';
import { AppModule } from './app.module.js';
import { getTrustedWebOrigins, loadEnv } from './common/env.js';
import { createOriginMiddleware } from './common/origin.middleware.js';

async function bootstrap(): Promise<void> {
  try {
    loadEnvFile();
  } catch (error: unknown) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
  }
  const env = loadEnv();
  const trustedWebOrigins = getTrustedWebOrigins(env);
  const app = await NestFactory.create(AppModule, {
    cors: { origin: trustedWebOrigins, credentials: true },
  });
  app.use(cookieParser());
  app.use(createOriginMiddleware(trustedWebOrigins));
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  await app.listen(env.PORT, '0.0.0.0');
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`[api] Startup failed: ${message}\n`);
  process.exitCode = 1;
});

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { loadEnvFile } from 'node:process';
import { AppModule } from './app.module.js';
import { loadEnv } from './common/env.js';

async function bootstrap(): Promise<void> {
  try {
    loadEnvFile();
  } catch (error: unknown) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
  }
  const env = loadEnv();
  const app = await NestFactory.create(AppModule, {
    cors: { origin: env.WEB_ORIGIN, credentials: true },
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  await app.listen(3000, '0.0.0.0');
}

void bootstrap();

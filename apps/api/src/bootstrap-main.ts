import { PrismaClient } from '@prisma/client';
import { ensureBootstrapData } from './bootstrap-seed.js';

const prisma = new PrismaClient();

try {
  await ensureBootstrapData(prisma);
} finally {
  await prisma.$disconnect();
}

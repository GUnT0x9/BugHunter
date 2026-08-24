import { PrismaClient } from '@prisma/client';
import { seedDatabase } from './seed.js';

const prisma = new PrismaClient();

try {
  await seedDatabase(prisma);
} finally {
  await prisma.$disconnect();
}

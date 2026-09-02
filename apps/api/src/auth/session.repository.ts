import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service.js';

const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  bio: true,
  role: true,
  totalXp: true,
} as const;

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(id: string, userId: string, expiresAt: Date) {
    return this.prisma.authSession.create({ data: { id, userId, expiresAt } });
  }

  findById(id: string) {
    return this.prisma.authSession.findUnique({
      where: { id },
      select: { expiresAt: true, user: { select: publicUserSelect } },
    });
  }

  refresh(id: string, expiresAt: Date) {
    return this.prisma.authSession.update({ where: { id }, data: { expiresAt } });
  }

  delete(id: string) {
    return this.prisma.authSession.deleteMany({ where: { id } });
  }
}

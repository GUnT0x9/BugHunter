import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../common/prisma.service.js';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  findPublicById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, username: true, bio: true, role: true, totalXp: true },
    });
  }

  create(input: { email: string; username: string; passwordHash: string; role?: UserRole }) {
    return this.prisma.user.create({ data: input });
  }

  updateProfile(id: string, username: string, bio: string) {
    return this.prisma.user.update({ where: { id }, data: { username, bio } });
  }
}

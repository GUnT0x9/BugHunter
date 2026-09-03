import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../common/prisma.service.js';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByGoogleSub(googleSub: string) {
    return this.prisma.user.findUnique({ where: { googleSub } });
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

  createGoogle(input: { email: string; username: string; googleSub: string }) {
    return this.prisma.user.create({ data: input });
  }

  linkGoogle(id: string, googleSub: string) {
    return this.prisma.user.update({ where: { id }, data: { googleSub } });
  }

  updateProfile(id: string, username: string, bio: string) {
    return this.prisma.user.update({ where: { id }, data: { username, bio } });
  }

  async deleteAccount(id: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.duelRoom.deleteMany({ where: { participants: { some: { userId: id } } } }),
      this.prisma.user.delete({ where: { id } }),
    ]);
  }
}

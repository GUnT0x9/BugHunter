import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DuelStatus, SubmissionStatus } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../common/prisma.service.js';
import type { User } from '@bughunter/contracts';
import { MissionRepository } from '../missions/mission.repository.js';

const ROOM_MS = 15 * 60 * 1000;

@Injectable()
export class DuelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly missions: MissionRepository,
  ) {}

  async active(userId: string) {
    const entry = await this.prisma.duelParticipant.findFirst({
      where: { userId, room: { status: { in: [DuelStatus.WAITING, DuelStatus.ACTIVE] } } },
      orderBy: { joinedAt: 'desc' },
      select: { roomId: true },
    });
    return entry ? this.get(userId, entry.roomId) : null;
  }

  async create(user: User, missionId: string) {
    const userId = user.id;
    await this.ensureAvailable(userId);
    const mission = await this.missions.getPublic(missionId, user);
    if (mission.isLocked)
      throw new ForbiddenException('잠금 해제된 문제만 대결에 사용할 수 있습니다.');
    const progress = await this.progress(userId, missionId);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const room = await this.prisma.duelRoom.create({
          data: {
            code: randomBytes(4).toString('hex').slice(0, 6).toUpperCase(),
            missionId,
            expiresAt: new Date(Date.now() + ROOM_MS),
            participants: {
              create: { userId, attemptBase: progress.attempts, hintBase: progress.highestHint },
            },
          },
        });
        return this.get(userId, room.id);
      } catch (error) {
        if (attempt === 4) throw error;
      }
    }
    throw new ConflictException('대결방 코드를 만들지 못했습니다.');
  }

  async join(user: User, code: string) {
    const userId = user.id;
    await this.ensureAvailable(userId);
    const room = await this.prisma.duelRoom.findUnique({
      where: { code },
      include: { participants: true },
    });
    if (!room || room.status !== DuelStatus.WAITING || room.expiresAt <= new Date())
      throw new NotFoundException('참가 가능한 대결방이 아닙니다.');
    if (room.participants.length >= 2) throw new ConflictException('이미 인원이 찬 대결방입니다.');
    if (room.participants.some((item) => item.userId === userId)) return this.get(userId, room.id);
    const mission = await this.missions.getPublic(room.missionId, user);
    if (mission.isLocked)
      throw new ForbiddenException('이 문제를 먼저 잠금 해제해야 참가할 수 있습니다.');
    const progress = await this.progress(userId, room.missionId);
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.duelRoom.updateMany({
        where: { id: room.id, status: DuelStatus.WAITING },
        data: {
          status: DuelStatus.ACTIVE,
          startedAt: new Date(),
          expiresAt: new Date(Date.now() + ROOM_MS),
        },
      });
      if (claimed.count !== 1) throw new ConflictException('다른 사용자가 먼저 참가했습니다.');
      await tx.duelParticipant.create({
        data: {
          roomId: room.id,
          userId,
          attemptBase: progress.attempts,
          hintBase: progress.highestHint,
        },
      });
    });
    return this.get(userId, room.id);
  }

  async get(userId: string, id: string) {
    let room = await this.prisma.duelRoom.findUnique({
      where: { id },
      include: {
        mission: { select: { id: true, title: true, difficulty: true } },
        participants: { include: { user: { select: { id: true, username: true } } } },
      },
    });
    if (!room) throw new NotFoundException('대결방을 찾을 수 없습니다.');
    if (!room.participants.some((item) => item.userId === userId))
      throw new ForbiddenException('참가자만 대결방을 볼 수 있습니다.');
    const expired = room.expiresAt <= new Date();
    if (room.status === DuelStatus.WAITING && expired) {
      room = await this.prisma.duelRoom.update({
        where: { id },
        data: {
          status: DuelStatus.CANCELLED,
          finishedAt: new Date(),
        },
        include: {
          mission: { select: { id: true, title: true, difficulty: true } },
          participants: { include: { user: { select: { id: true, username: true } } } },
        },
      });
    }
    const startedAt = room.startedAt ?? room.createdAt;
    const missionId = room.missionId;
    const rows = await Promise.all(
      room.participants.map(async (entry) => {
        const [progress, submissions, passed] = await Promise.all([
          this.progress(entry.userId, missionId),
          this.prisma.submission.count({
            where: { userId: entry.userId, missionId, createdAt: { gte: startedAt } },
          }),
          this.prisma.submission.findFirst({
            where: {
              userId: entry.userId,
              missionId,
              status: SubmissionStatus.PASSED,
              createdAt: { gte: startedAt },
            },
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true },
          }),
        ]);
        return {
          id: entry.user.id,
          username: entry.user.username,
          attempts: submissions,
          hintUsed: progress.highestHint > entry.hintBase,
          solvedAt: passed?.createdAt ?? null,
        };
      }),
    );
    if (room.status === DuelStatus.ACTIVE) {
      const solved = rows
        .filter((row) => row.solvedAt)
        .sort(
          (a, b) =>
            Number(a.solvedAt) - Number(b.solvedAt) ||
            a.attempts - b.attempts ||
            Number(a.hintUsed) - Number(b.hintUsed),
        );
      if (solved[0]) {
        room = await this.prisma.duelRoom.update({
          where: { id },
          data: { status: DuelStatus.FINISHED, winnerId: solved[0].id, finishedAt: new Date() },
          include: {
            mission: { select: { id: true, title: true, difficulty: true } },
            participants: { include: { user: { select: { id: true, username: true } } } },
          },
        });
      } else if (expired) {
        room = await this.prisma.duelRoom.update({
          where: { id },
          data: { status: DuelStatus.FINISHED, finishedAt: new Date() },
          include: {
            mission: { select: { id: true, title: true, difficulty: true } },
            participants: { include: { user: { select: { id: true, username: true } } } },
          },
        });
      }
    }
    return {
      id: room.id,
      code: room.code,
      status: room.status,
      mission: room.mission,
      startedAt: room.startedAt,
      expiresAt: room.expiresAt,
      finishedAt: room.finishedAt,
      winnerId: room.winnerId,
      meId: userId,
      participants: rows,
    };
  }

  async cancel(userId: string, id: string) {
    const room = await this.prisma.duelRoom.findUnique({
      where: { id },
      include: { participants: { orderBy: { joinedAt: 'asc' } } },
    });
    if (!room) throw new NotFoundException('대결방을 찾을 수 없습니다.');
    if (room.participants[0]?.userId !== userId || room.status !== DuelStatus.WAITING)
      throw new ForbiddenException('대기 중인 방장만 취소할 수 있습니다.');
    await this.prisma.duelRoom.update({
      where: { id },
      data: { status: DuelStatus.CANCELLED, finishedAt: new Date() },
    });
    return { ok: true as const };
  }

  private async ensureAvailable(userId: string) {
    const active = await this.prisma.duelParticipant.findFirst({
      where: {
        userId,
        room: {
          status: { in: [DuelStatus.WAITING, DuelStatus.ACTIVE] },
          expiresAt: { gt: new Date() },
        },
      },
    });
    if (active) throw new ConflictException('이미 진행 중인 대결이 있습니다.');
  }

  private async progress(userId: string, missionId: string) {
    return (
      (await this.prisma.missionProgress.findUnique({
        where: { userId_missionId: { userId, missionId } },
        select: { attempts: true, highestHint: true },
      })) ?? { attempts: 0, highestHint: 0 }
    );
  }
}

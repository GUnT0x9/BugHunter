import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DuelStatus, SubmissionStatus, type Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../common/prisma.service.js';
import type { User } from '@bughunter/contracts';
import { MissionRepository } from '../missions/mission.repository.js';

const ROOM_MS = 15 * 60 * 1000;
const WIN_XP = 50;
const DAILY_XP_CAP = 300;
const SAME_OPPONENT_REWARD_LIMIT = 3;

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

  async history(userId: string) {
    const entries = await this.prisma.duelRoom.findMany({
      where: { status: DuelStatus.FINISHED, participants: { some: { userId } } },
      orderBy: { finishedAt: 'desc' },
      take: 20,
      include: {
        mission: { select: { id: true, title: true } },
        participants: { include: { user: { select: { id: true, username: true } } } },
      },
    });
    const wins = entries.filter((room) => room.winnerId === userId).length;
    const losses = entries.filter((room) => room.winnerId && room.winnerId !== userId).length;
    const draws = entries.length - wins - losses;
    let streak = 0;
    for (const room of entries) {
      if (room.winnerId !== userId) break;
      streak += 1;
    }
    return {
      summary: {
        total: entries.length,
        wins,
        losses,
        draws,
        winRate: entries.length ? Math.round((wins / entries.length) * 100) : 0,
        streak,
      },
      entries: entries.map((room) => {
        const me = room.participants.find((entry) => entry.userId === userId);
        const opponent = room.participants.find((entry) => entry.userId !== userId);
        return {
          id: room.id,
          mission: room.mission,
          result: room.winnerId === userId ? 'WIN' : room.winnerId ? 'LOSS' : 'DRAW',
          opponent: opponent?.user ?? null,
          attempts: me?.attempts ?? 0,
          hintUsed: me?.hintUsed ?? false,
          solvedAt: me?.solvedAt ?? null,
          startedAt: room.startedAt,
          finishedAt: room.finishedAt,
          rewardXp: room.winnerId === userId ? room.rewardXp : 0,
        };
      }),
    };
  }

  async create(user: User, difficulty: number) {
    const userId = user.id;
    await this.ensureAvailable(userId);
    const candidates = await this.prisma.mission.findMany({
      where: { isPublished: true, difficulty },
      select: { id: true },
    });
    if (!candidates.length)
      throw new NotFoundException('해당 난이도의 문제를 찾을 수 없습니다.');
    const missionId = candidates[Math.floor(Math.random() * candidates.length)]!.id;
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
    const progress = await this.progress(userId, room.missionId);
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.duelRoom.updateMany({
        where: { id: room.id, status: DuelStatus.WAITING },
        data: { expiresAt: new Date(Date.now() + ROOM_MS) },
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

  async start(userId: string, id: string) {
    const room = await this.prisma.duelRoom.findUnique({
      where: { id },
      include: { participants: { orderBy: { joinedAt: 'asc' } } },
    });
    if (!room) throw new NotFoundException('대결방을 찾을 수 없습니다.');
    if (room.participants[0]?.userId !== userId || room.status !== DuelStatus.WAITING)
      throw new ForbiddenException('대기 중인 방장만 시작할 수 있습니다.');
    if (room.participants.length < 2)
      throw new ConflictException('상대가 참가해야 시작할 수 있습니다.');
    await this.prisma.duelRoom.updateMany({
      where: { id, status: DuelStatus.WAITING },
      data: {
        status: DuelStatus.ACTIVE,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + ROOM_MS),
      },
    });
    return this.get(userId, id);
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
        await this.finishRoom(id, solved[0].id, rows);
        room = await this.roomOrThrow(id);
      } else if (expired) {
        await this.finishRoom(id, null, rows);
        room = await this.roomOrThrow(id);
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
      rewardXp: room.rewardXp,
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

  private roomOrThrow(id: string) {
    return this.prisma.duelRoom.findUniqueOrThrow({
      where: { id },
      include: {
        mission: { select: { id: true, title: true, difficulty: true } },
        participants: { include: { user: { select: { id: true, username: true } } } },
      },
    });
  }

  private async finishRoom(
    roomId: string,
    winnerId: string | null,
    rows: Array<{ id: string; attempts: number; hintUsed: boolean; solvedAt: Date | null }>,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const claimed = await tx.duelRoom.updateMany({
          where: { id: roomId, status: DuelStatus.ACTIVE },
          data: { status: DuelStatus.FINISHED, winnerId, finishedAt: new Date() },
        });
        if (!claimed.count) return;
        for (const row of rows) {
          await tx.duelParticipant.update({
            where: { roomId_userId: { roomId, userId: row.id } },
            data: { attempts: row.attempts, hintUsed: row.hintUsed, solvedAt: row.solvedAt },
          });
        }
        if (!winnerId) return;
        const opponentId = rows.find((row) => row.id !== winnerId)?.id;
        const dayStart = koreanDayStart(new Date());
        const [daily, repeatCount] = await Promise.all([
          tx.duelReward.aggregate({
            where: { userId: winnerId, createdAt: { gte: dayStart } },
            _sum: { amount: true },
          }),
          opponentId
            ? tx.duelReward.count({
                where: {
                  userId: winnerId,
                  createdAt: { gte: dayStart },
                  room: { participants: { some: { userId: opponentId } } },
                },
              })
            : 0,
        ]);
        const amount = duelRewardAmount(daily._sum.amount ?? 0, repeatCount);
        await tx.duelReward.create({ data: { roomId, userId: winnerId, amount } });
        await tx.duelRoom.update({ where: { id: roomId }, data: { rewardXp: amount } });
        if (amount)
          await tx.user.update({
            where: { id: winnerId },
            data: { totalXp: { increment: amount } },
          });
      },
      { isolationLevel: 'Serializable' as Prisma.TransactionIsolationLevel },
    );
  }
}

export function duelRewardAmount(dailyXp: number, sameOpponentRewards: number): number {
  const remaining = Math.max(0, DAILY_XP_CAP - dailyXp);
  return sameOpponentRewards < SAME_OPPONENT_REWARD_LIMIT ? Math.min(WIN_XP, remaining) : 0;
}

export function koreanDayStart(now: Date): Date {
  const shifted = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - 9 * 60 * 60 * 1000);
}

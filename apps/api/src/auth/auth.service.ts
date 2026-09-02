import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import type { LoginInput, ProfileUpdate, RegisterInput, User } from '@bughunter/contracts';
import { AuthRepository } from './auth.repository.js';

const PASSWORD_HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

function toPublicUser(user: {
  id: string;
  email: string;
  username: string;
  bio: string;
  role: User['role'];
  totalXp: number;
}): User {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    bio: user.bio,
    role: user.role,
    totalXp: user.totalXp,
  };
}

@Injectable()
export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async register(input: RegisterInput): Promise<User> {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();
    const [emailUser, usernameUser] = await Promise.all([
      this.repository.findByEmail(email),
      this.repository.findByUsername(username),
    ]);
    if (emailUser) throw new ConflictException('이미 사용 중인 이메일입니다.');
    if (usernameUser) throw new ConflictException('이미 사용 중인 닉네임입니다.');

    const passwordHash = await argon2.hash(input.password, PASSWORD_HASH_OPTIONS);
    try {
      const user = await this.repository.create({
        email,
        username,
        passwordHash,
      });
      return toPublicUser(user);
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('이미 사용 중인 이메일 또는 닉네임입니다.');
      }
      throw error;
    }
  }

  async login(input: LoginInput): Promise<User> {
    const user = await this.repository.findByEmail(input.email.trim().toLowerCase());
    if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    return toPublicUser(user);
  }

  async updateProfile(userId: string, input: ProfileUpdate): Promise<User> {
    try {
      return toPublicUser(
        await this.repository.updateProfile(userId, input.username.trim(), input.bio.trim()),
      );
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('이미 사용 중인 닉네임입니다.');
      }
      throw error;
    }
  }

  async deleteAccount(userId: string, password: string): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('비밀번호가 올바르지 않습니다.');
    }
    if (user.role === 'ADMIN') throw new ForbiddenException('관리자 계정은 삭제할 수 없습니다.');
    await this.repository.deleteAccount(userId);
  }
}

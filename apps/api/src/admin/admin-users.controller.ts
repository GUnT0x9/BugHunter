import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@bughunter/contracts';
import { z } from 'zod';
import { AdminGuard } from '../auth/admin.guard.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { parseBody } from '../common/validation.js';
import { AdminRepository } from './admin.repository.js';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  query: z.string().trim().max(100).default(''),
});

@Controller('admin/users')
@UseGuards(SessionAuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(private readonly admin: AdminRepository) {}

  @Get()
  list(@Query() query: unknown) {
    return this.admin.listUsers(
      parseBody(QuerySchema, query) as { page: number; limit: number; query: string },
    );
  }

  @Delete(':id')
  async remove(@CurrentUser() current: User, @Param('id') id: string): Promise<{ ok: true }> {
    if (current.id === id) throw new NotFoundException('현재 로그인한 계정은 삭제할 수 없습니다.');
    await this.admin.deleteUser(id);
    return { ok: true };
  }
}

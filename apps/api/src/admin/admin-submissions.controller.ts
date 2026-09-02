import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { parseBody } from '../common/validation.js';
import { AdminRepository } from './admin.repository.js';
import { AdminSubmissionQuerySchema } from './admin-submission.schema.js';
import type { AdminSubmissionQuery } from './admin-submission.schema.js';

@Controller('admin/submissions')
@UseGuards(SessionAuthGuard, AdminGuard)
export class AdminSubmissionsController {
  constructor(private readonly admin: AdminRepository) {}

  @Get()
  list(@Query() query: unknown) {
    const input = parseBody(AdminSubmissionQuerySchema, query) as AdminSubmissionQuery;
    return this.admin.listSubmissionLogs(input);
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const submission = await this.admin.getSubmissionLog(id);
    if (!submission) throw new NotFoundException('제출 로그를 찾을 수 없습니다.');
    return submission;
  }
}

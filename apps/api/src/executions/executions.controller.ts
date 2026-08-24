import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  MissionCodeSchema,
  type ExecutionResult,
  type SubmissionResult,
  type User,
} from '@bughunter/contracts';
import { parseBody } from '../common/validation.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { ExecutionsService } from './executions.service.js';
import { SubmissionRepository } from './submission.repository.js';

@Controller()
@UseGuards(SessionAuthGuard)
export class ExecutionsController {
  constructor(
    private readonly executions: ExecutionsService,
    private readonly submissions: SubmissionRepository,
  ) {}

  @Post('missions/:id/runs')
  run(@Param('id') missionId: string, @Body() body: unknown, @CurrentUser() user: User) {
    return this.executions.enqueueRun(user, missionId, parseBody(MissionCodeSchema, body));
  }

  @Post('missions/:id/submissions')
  submit(@Param('id') missionId: string, @Body() body: unknown, @CurrentUser() user: User) {
    return this.executions.enqueueSubmission(user, missionId, parseBody(MissionCodeSchema, body));
  }

  @Get('executions/:id')
  get(@Param('id') executionId: string, @CurrentUser() user: User): Promise<ExecutionResult> {
    return this.executions.getForUser(executionId, user.id);
  }

  @Get('submissions/:id')
  getSubmission(
    @Param('id') submissionId: string,
    @CurrentUser() user: User,
  ): Promise<SubmissionResult> {
    return this.submissions.getForUser(submissionId, user.id);
  }
}

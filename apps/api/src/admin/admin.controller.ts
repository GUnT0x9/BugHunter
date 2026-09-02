import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { parseBody } from '../common/validation.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import {
  AdminMissionDraftCreateSchema,
  AdminMissionPatchSchema,
  AdminMissionSchema,
} from './admin-mission.schema.js';
import { AdminJudgeValidationService } from './admin-judge-validation.service.js';
import { AdminRepository } from './admin.repository.js';

@Controller('admin/missions')
@UseGuards(SessionAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly admin: AdminRepository,
    private readonly judgeValidation: AdminJudgeValidationService,
  ) {}

  @Get()
  list() {
    return this.admin.listMissions();
  }

  @Post()
  create(@Body() body: unknown) {
    const input = parseBody(AdminMissionSchema, body);
    return this.admin.createMission({ ...input, isBoss: input.isBoss ?? false });
  }

  @Post('draft')
  createDraft(@Body() body: unknown) {
    return this.admin.createDraftMission(parseBody(AdminMissionDraftCreateSchema, body));
  }

  @Get(':id/preview')
  preview(@Param('id') id: string) {
    return this.admin.previewMission(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.admin.updateMission(id, parseBody(AdminMissionPatchSchema, body));
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.admin.duplicateMission(id);
  }

  @Post(':id/validate')
  async validate(@Param('id') id: string) {
    const shape = await this.admin.validateMission(id);
    return shape.ready ? this.judgeValidation.validate(id) : shape;
  }

  @Patch(':id/publish')
  async publish(@Param('id') id: string) {
    return this.admin.publish(id);
  }

  @Patch(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.admin.unpublish(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.admin.deleteMission(id);
  }
}

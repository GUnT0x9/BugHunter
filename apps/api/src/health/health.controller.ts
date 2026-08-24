import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  status() {
    return this.health.status();
  }

  @Get('ready')
  readiness() {
    return this.health.readiness();
  }
}

import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ExecutionStore } from './execution.store.js';
import { JudgeProviderService } from './judge-provider.service.js';

const DISPATCH_INTERVAL_MS = 2_000;
const WARNING_INTERVAL_MS = 30_000;

@Injectable()
export class QueueDispatcherService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(QueueDispatcherService.name);
  private timer: NodeJS.Timeout | null = null;
  private isDispatching = false;
  private lastWarningAt = 0;

  constructor(
    private readonly executions: ExecutionStore,
    private readonly judgeProvider: JudgeProviderService,
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => void this.dispatchPending(), DISPATCH_INTERVAL_MS);
    this.timer.unref();
    void this.dispatchPending();
  }

  async dispatchPending(): Promise<void> {
    if (this.isDispatching) return;
    this.isDispatching = true;
    try {
      await this.executions.recoverInterruptedExecutions();
      if (!(await this.judgeProvider.isAvailable())) return;
      const candidates = await this.executions.findDispatchCandidates();
      for (const candidate of candidates) await this.dispatchOne(candidate.id);
    } catch (error: unknown) {
      this.warnUnavailable('Judge recovery unavailable', error);
    } finally {
      this.isDispatching = false;
    }
  }

  async dispatchOne(executionId: string): Promise<void> {
    try {
      await this.judgeProvider.dispatch(executionId);
      await this.executions.markEnqueued(executionId);
    } catch (error: unknown) {
      this.warnUnavailable('Judge dispatch unavailable', error);
    }
  }

  private warnUnavailable(message: string, error: unknown): void {
    const now = Date.now();
    if (now - this.lastWarningAt < WARNING_INTERVAL_MS) return;
    this.lastWarningAt = now;
    this.logger.warn(`${message}: ${error instanceof Error ? error.message : 'unknown error'}`);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}

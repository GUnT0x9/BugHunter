import { Injectable } from '@nestjs/common';
import { JudgeQueueService } from './judge-queue.service.js';
import { Judge0Runner } from './judge0-runner.js';
import { RemoteExecutionService } from './remote-execution.service.js';

@Injectable()
export class JudgeProviderService {
  readonly provider = ['judge0', 'code_compiler'].includes(process.env.JUDGE_PROVIDER ?? '')
    ? 'judge0'
    : 'docker';

  constructor(
    private readonly queue: JudgeQueueService,
    private readonly remoteExecution: RemoteExecutionService,
    private readonly remoteRunner: Judge0Runner,
  ) {}

  isAvailable(): Promise<boolean> {
    return this.provider === 'judge0'
      ? this.remoteRunner.isAvailable()
      : this.queue.hasAvailableWorker();
  }

  async dispatch(executionId: string): Promise<void> {
    if (this.provider === 'judge0') {
      this.remoteExecution.dispatch(executionId);
      return;
    }
    await this.queue.enqueue(executionId);
  }
}

import { Injectable } from '@nestjs/common';
import { JudgeQueueService } from './judge-queue.service.js';
import { CodeCompilerRunner } from './code-compiler-runner.js';
import { RemoteExecutionService } from './remote-execution.service.js';

@Injectable()
export class JudgeProviderService {
  readonly provider = process.env.JUDGE_PROVIDER === 'code_compiler' ? 'code_compiler' : 'docker';

  constructor(
    private readonly queue: JudgeQueueService,
    private readonly remoteExecution: RemoteExecutionService,
    private readonly remoteRunner: CodeCompilerRunner,
  ) {}

  isAvailable(): Promise<boolean> {
    return this.provider === 'code_compiler'
      ? this.remoteRunner.isAvailable()
      : this.queue.hasAvailableWorker();
  }

  async dispatch(executionId: string): Promise<void> {
    if (this.provider === 'code_compiler') {
      this.remoteExecution.dispatch(executionId);
      return;
    }
    await this.queue.enqueue(executionId);
  }
}

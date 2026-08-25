import { Injectable } from '@nestjs/common';
const RUN_TIMEOUT_MS = 3_000;
const REQUEST_TIMEOUT_MS = RUN_TIMEOUT_MS + 1_000;
const OUTPUT_LIMIT_BYTES = 64 * 1024;
const MIN_REQUEST_INTERVAL_MS = 220;
const AVAILABILITY_CACHE_MS = 5 * 60_000;

type CodeCompilerResponse = {
  stdout?: string;
  stderr?: string;
  code?: number | null;
  signal?: string | null;
  error?: string;
  message?: string;
};

export type RemoteRunResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTimeMs: number;
  timedOut: boolean;
  outputLimited: boolean;
};

@Injectable()
export class CodeCompilerRunner {
  private readonly apiUrl: string;
  private requestChain: Promise<void> = Promise.resolve();
  private lastRequestAt = 0;
  private availableUntil = 0;

  constructor(
    apiUrl = process.env.CODE_COMPILER_API_URL ?? 'https://codecompiler.forgesparse.com/api/run',
  ) {
    this.apiUrl = apiUrl.replace(/\/$/, '');
  }

  async isAvailable(): Promise<boolean> {
    if (Date.now() < this.availableUntil) return true;
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          language: 'python',
          version: '3.10.0',
          files: [{ name: 'main.py', content: 'print("ready")' }],
          stdin: '',
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const payload = (await response.json()) as CodeCompilerResponse;
      const available = response.ok && payload.code === 0;
      if (available) this.availableUntil = Date.now() + AVAILABILITY_CACHE_MS;
      return available;
    } catch {
      return false;
    }
  }

  async execute(code: string, stdin: string): Promise<RemoteRunResult> {
    return this.schedule(() => this.executeRequest(code, stdin));
  }

  private async schedule<T>(task: () => Promise<T>): Promise<T> {
    const previous = this.requestChain;
    let release = (): void => undefined;
    this.requestChain = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    const waitMs = Math.max(0, MIN_REQUEST_INTERVAL_MS - (Date.now() - this.lastRequestAt));
    if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
    this.lastRequestAt = Date.now();
    try {
      return await task();
    } finally {
      release();
    }
  }

  private async executeRequest(code: string, stdin: string): Promise<RemoteRunResult> {
    const startedAt = Date.now();
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          language: 'python',
          version: '3.10.0',
          files: [{ name: 'main.py', content: code }],
          stdin,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const payload = (await response.json()) as CodeCompilerResponse;
      if (!response.ok || payload.code === undefined || payload.code === null) {
        throw new Error(
          payload.message ??
            payload.error ??
            `Code execution failed with status ${response.status}`,
        );
      }
      const stdout = payload.stdout ?? '';
      const stderr = payload.stderr ?? '';
      const combinedBytes = Buffer.byteLength(stdout) + Buffer.byteLength(stderr);
      return {
        stdout,
        stderr,
        exitCode: payload.code,
        executionTimeMs: Date.now() - startedAt,
        timedOut: false,
        outputLimited: combinedBytes > OUTPUT_LIMIT_BYTES,
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        return {
          stdout: '',
          stderr: '',
          exitCode: null,
          executionTimeMs: Date.now() - startedAt,
          timedOut: true,
          outputLimited: false,
        };
      }
      throw error;
    }
  }
}

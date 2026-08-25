import { Injectable } from '@nestjs/common';

const PYTHON_LANGUAGE_ID = 109;
const CPU_TIME_LIMIT_SECONDS = 3;
const WALL_TIME_LIMIT_SECONDS = 4;
const REQUEST_TIMEOUT_MS = 8_000;
const OUTPUT_LIMIT_BYTES = 64 * 1024;
const MIN_REQUEST_INTERVAL_MS = 220;
const AVAILABILITY_CACHE_MS = 5 * 60_000;

type Judge0Response = {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  time?: string | null;
  exit_code?: number | null;
  message?: string | null;
  status_id?: number;
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
export class Judge0Runner {
  private readonly apiUrl = (process.env.JUDGE0_API_URL ?? 'https://ce.judge0.com').replace(
    /\/$/,
    '',
  );
  private requestChain: Promise<void> = Promise.resolve();
  private lastRequestAt = 0;
  private availableUntil = 0;

  async isAvailable(): Promise<boolean> {
    if (Date.now() < this.availableUntil) return true;
    try {
      const result = await this.execute('print("ready")', '');
      const available = result.exitCode === 0 && result.stdout.trim() === 'ready';
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
    const response = await fetch(
      `${this.apiUrl}/submissions?wait=true&fields=stdout,stderr,compile_output,time,exit_code,message,status_id`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          language_id: PYTHON_LANGUAGE_ID,
          source_code: code,
          stdin,
          cpu_time_limit: CPU_TIME_LIMIT_SECONDS,
          wall_time_limit: WALL_TIME_LIMIT_SECONDS,
          enable_network: false,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    );
    const payload = (await response.json()) as Judge0Response;
    if (!response.ok || payload.status_id === undefined || payload.status_id >= 13) {
      throw new Error(payload.message ?? `Judge0 request failed with status ${response.status}`);
    }
    const stdout = payload.stdout ?? '';
    const stderr = payload.stderr ?? payload.compile_output ?? '';
    const combinedBytes = Buffer.byteLength(stdout) + Buffer.byteLength(stderr);
    const timedOut = payload.status_id === 5;
    return {
      stdout,
      stderr,
      exitCode: timedOut ? null : (payload.exit_code ?? null),
      executionTimeMs: Math.max(0, Math.round(Number(payload.time ?? 0) * 1_000)),
      timedOut,
      outputLimited: combinedBytes > OUTPUT_LIMIT_BYTES,
    };
  }
}

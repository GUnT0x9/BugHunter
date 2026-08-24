import Docker from 'dockerode';
import { PassThrough } from 'node:stream';

export const JUDGE_LIMITS = {
  timeoutMs: 3_000,
  memoryBytes: 128 * 1024 * 1024,
  nanoCpus: 500_000_000,
  pidsLimit: 32,
  outputBytes: 64 * 1024,
} as const;

const PYTHON_WRAPPER =
  'import io, sys; sys.stdin = io.TextIOWrapper(io.BytesIO(sys.argv[2].encode("utf-8")), encoding="utf-8"); exec(compile(sys.argv[1], "main.py", "exec"), {"__name__": "__main__"})';

export type DockerRunResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTimeMs: number;
  timedOut: boolean;
  outputLimited: boolean;
};

export function buildContainerOptions(image: string, code = '', input = '') {
  return {
    Image: image,
    Cmd: ['python', '-I', '-B', '-c', PYTHON_WRAPPER, code, input],
    User: '65534:65534',
    WorkingDir: '/tmp',
    Tty: false,
    OpenStdin: false,
    StdinOnce: false,
    StopTimeout: 1,
    HostConfig: {
      NetworkMode: 'none',
      ReadonlyRootfs: true,
      CapDrop: ['ALL'],
      Memory: JUDGE_LIMITS.memoryBytes,
      MemorySwap: JUDGE_LIMITS.memoryBytes,
      NanoCpus: JUDGE_LIMITS.nanoCpus,
      PidsLimit: JUDGE_LIMITS.pidsLimit,
      AutoRemove: false,
      Init: true,
      SecurityOpt: ['no-new-privileges:true'],
    },
  };
}

class OutputCollector {
  private readonly stdoutChunks: Buffer[] = [];
  private readonly stderrChunks: Buffer[] = [];
  private outputBytes = 0;
  private resolveLimit!: () => void;
  readonly limitReached = new Promise<void>((resolve) => {
    this.resolveLimit = resolve;
  });
  limited = false;

  append(target: 'stdout' | 'stderr', chunk: Buffer): void {
    if (this.limited) return;
    const remaining = JUDGE_LIMITS.outputBytes - this.outputBytes;
    const clipped = chunk.subarray(0, Math.max(remaining, 0));
    if (clipped.length > 0) {
      (target === 'stdout' ? this.stdoutChunks : this.stderrChunks).push(clipped);
      this.outputBytes += clipped.length;
    }
    if (chunk.length > remaining) {
      this.limited = true;
      this.resolveLimit();
    }
  }

  result(): Pick<DockerRunResult, 'stdout' | 'stderr'> {
    return {
      stdout: Buffer.concat(this.stdoutChunks).toString('utf8'),
      stderr: Buffer.concat(this.stderrChunks).toString('utf8'),
    };
  }
}

function waitForEnd(stream: NodeJS.ReadableStream): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.once('end', resolve);
    stream.once('error', reject);
  });
}

async function finishOutputStreams(
  attached: NodeJS.ReadWriteStream,
  stdout: PassThrough,
  stderr: PassThrough,
  outputFinished: Promise<unknown>,
): Promise<void> {
  let timer: NodeJS.Timeout | null = null;
  const drainTimeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, 250);
  });
  await Promise.race([outputFinished.catch(() => undefined), drainTimeout]);
  if (timer) clearTimeout(timer);
  (attached as NodeJS.ReadWriteStream & { destroy: () => void }).destroy();
  stdout.end();
  stderr.end();
}

type StopReason =
  { kind: 'exit'; exitCode: number } | { kind: 'timeout' } | { kind: 'output-limit' };

function waitForStop(
  container: Docker.Container,
  limitReached: Promise<void>,
): { promise: Promise<StopReason>; cancel: () => void } {
  let timer: NodeJS.Timeout | null = null;
  const timeout = new Promise<StopReason>((resolve) => {
    timer = setTimeout(() => resolve({ kind: 'timeout' }), JUDGE_LIMITS.timeoutMs);
  });
  const promise = Promise.race([
    container.wait().then((result) => ({ kind: 'exit' as const, exitCode: result.StatusCode })),
    timeout,
    limitReached.then(() => ({ kind: 'output-limit' as const })),
  ]);
  return {
    promise,
    cancel: () => {
      if (timer) clearTimeout(timer);
    },
  };
}

export class DockerRunner {
  constructor(
    private readonly docker: Docker,
    private readonly image: string,
  ) {}

  async execute(code: string, input: string): Promise<DockerRunResult> {
    const startedAt = Date.now();
    const container = await this.docker.createContainer(
      buildContainerOptions(this.image, code, input),
    );
    try {
      const attached = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
      });
      const stdout = new PassThrough();
      const stderr = new PassThrough();
      const collector = new OutputCollector();
      stdout.on('data', (chunk: Buffer) => collector.append('stdout', Buffer.from(chunk)));
      stderr.on('data', (chunk: Buffer) => collector.append('stderr', Buffer.from(chunk)));
      this.docker.modem.demuxStream(attached, stdout, stderr);
      const outputFinished = Promise.all([waitForEnd(stdout), waitForEnd(stderr)]);

      await container.start();
      const stopWaiter = waitForStop(container, collector.limitReached);
      const stop = await stopWaiter.promise.finally(stopWaiter.cancel);
      if (stop.kind !== 'exit') {
        await container.kill().catch(() => undefined);
        await container.wait().catch(() => undefined);
      }
      await finishOutputStreams(attached, stdout, stderr, outputFinished);
      const output = collector.result();
      return {
        ...output,
        exitCode: stop.kind === 'exit' ? stop.exitCode : null,
        executionTimeMs: Date.now() - startedAt,
        timedOut: stop.kind === 'timeout',
        outputLimited: stop.kind === 'output-limit',
      };
    } finally {
      await container.remove({ force: true }).catch(() => undefined);
    }
  }
}

import Docker from 'dockerode';
import { describe, expect, it } from 'vitest';
import { DockerRunner } from './docker-runner.js';

const dockerEnabled = process.env.RUN_DOCKER_TESTS === '1';
const runner = new DockerRunner(new Docker(), process.env.JUDGE_IMAGE ?? 'python:3.12-alpine');

describe.skipIf(!dockerEnabled)('DockerRunner integration', () => {
  it('runs normal Unicode output', async () => {
    const result = await runner.execute('print(input())', '안녕\n');
    expect(result).toMatchObject({ stdout: '안녕\n', exitCode: 0, timedOut: false });
  });

  it('preserves main.py syntax locations', async () => {
    const result = await runner.execute('print(', '');
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('File "main.py", line 1');
  });

  it('terminates infinite loops', async () => {
    const result = await runner.execute('while True: pass', '');
    expect(result.timedOut).toBe(true);
  }, 8_000);

  it('terminates output over 64KB', async () => {
    const result = await runner.execute('while True: print("x" * 1024)', '');
    expect(result.outputLimited).toBe(true);
  }, 8_000);

  it('blocks network access', async () => {
    const result = await runner.execute(
      'import socket\nsocket.create_connection(("1.1.1.1", 53), timeout=1)',
      '',
    );
    expect(result.exitCode).not.toBe(0);
  });

  it('blocks writes to the read-only root filesystem', async () => {
    const result = await runner.execute('open("/blocked", "w").write("x")', '');
    expect(result.exitCode).not.toBe(0);
  });

  it('limits process creation', async () => {
    const result = await runner.execute(
      'import subprocess\nprocs = [subprocess.Popen(["python", "-c", "import time; time.sleep(2)"]) for _ in range(64)]',
      '',
    );
    expect(result.exitCode).not.toBe(0);
  }, 8_000);
});

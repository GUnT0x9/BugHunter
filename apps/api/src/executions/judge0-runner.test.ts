import { afterEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { Judge0Runner } from './judge0-runner.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('Judge0Runner', () => {
  it('can be constructed by Nest without an injection token', async () => {
    const module = await Test.createTestingModule({ providers: [Judge0Runner] }).compile();
    expect(module.get(Judge0Runner)).toBeInstanceOf(Judge0Runner);
    await module.close();
  });

  it('maps a successful Python execution', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          stdout: Buffer.from('BugHunter\n').toString('base64'),
          stderr: null,
          exit_code: 0,
          status_id: 3,
          time: '0.01',
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
    );
    const result = await new Judge0Runner().execute('print("BugHunter")', '');
    expect(result).toMatchObject({
      stdout: 'BugHunter\n',
      stderr: '',
      exitCode: 0,
      timedOut: false,
      outputLimited: false,
    });
  });

  it('uses Judge0 base64 mode for Unicode source, stdin, and output', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async (input, init) => {
      expect(String(input)).toContain('base64_encoded=true');
      const body = JSON.parse(String(init?.body)) as { source_code: string; stdin: string };
      expect(Buffer.from(body.source_code, 'base64').toString('utf8')).toBe(
        'name = input()\nprint(name)',
      );
      expect(Buffer.from(body.stdin, 'base64').toString('utf8')).toBe('민수\n');
      return new Response(
        JSON.stringify({
          stdout: Buffer.from('민수\n').toString('base64'),
          exit_code: 0,
          status_id: 3,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });

    await expect(
      new Judge0Runner().execute('name = input()\nprint(name)', '민수\n'),
    ).resolves.toMatchObject({ stdout: '민수\n', exitCode: 0 });
  });

  it('spaces consecutive requests after the previous response completes', async () => {
    const requestTimes: number[] = [];
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      requestTimes.push(Date.now());
      return new Response(
        JSON.stringify({
          stdout: Buffer.from('ok\n').toString('base64'),
          exit_code: 0,
          status_id: 3,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });
    const runner = new Judge0Runner();

    await runner.execute('print("first")', '');
    await runner.execute('print("second")', '');

    expect((requestTimes[1] ?? 0) - (requestTimes[0] ?? 0)).toBeGreaterThanOrEqual(950);
  });

  it('rejects an invalid upstream response', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: 'rate limited' }), {
          status: 429,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    globalThis.fetch = fetchMock;
    await expect(new Judge0Runner().execute('pass', '')).rejects.toThrow('rate limited');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('recovers from a transient upstream failure', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: Buffer.from('temporarily unavailable').toString('base64'),
            status_id: 13,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            stdout: Buffer.from('ok\n').toString('base64'),
            exit_code: 0,
            status_id: 3,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
    await expect(new Judge0Runner().execute('print("ok")', '')).resolves.toMatchObject({
      stdout: 'ok\n',
      exitCode: 0,
    });
  });

  it('marks oversized output', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            stdout: Buffer.from('x'.repeat(65_537)).toString('base64'),
            stderr: null,
            exit_code: 0,
            status_id: 3,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
    await expect(new Judge0Runner().execute('pass', '')).resolves.toMatchObject({
      outputLimited: true,
    });
  });
});

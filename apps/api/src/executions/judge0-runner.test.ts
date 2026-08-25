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
          stdout: 'BugHunter\n',
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

  it('rejects an invalid upstream response', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: 'rate limited' }), {
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
        new Response(JSON.stringify({ message: 'temporarily unavailable', status_id: 13 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ stdout: 'ok\n', exit_code: 0, status_id: 3 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
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
          JSON.stringify({ stdout: 'x'.repeat(65_537), stderr: null, exit_code: 0, status_id: 3 }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
    await expect(new Judge0Runner().execute('pass', '')).resolves.toMatchObject({
      outputLimited: true,
    });
  });
});

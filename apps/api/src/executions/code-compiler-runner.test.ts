import { afterEach, describe, expect, it, vi } from 'vitest';
import { CodeCompilerRunner } from './code-compiler-runner.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('CodeCompilerRunner', () => {
  it('maps a successful Python execution', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ stdout: 'BugHunter\n', stderr: '', code: 0, signal: null }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    const result = await new CodeCompilerRunner().execute('print("BugHunter")', '');
    expect(result).toMatchObject({
      stdout: 'BugHunter\n',
      stderr: '',
      exitCode: 0,
      timedOut: false,
      outputLimited: false,
    });
  });

  it('rejects an invalid upstream response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'rate limited' }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      }),
    );
    await expect(new CodeCompilerRunner().execute('pass', '')).rejects.toThrow('rate limited');
  });

  it('marks oversized output', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ stdout: 'x'.repeat(65_537), stderr: '', code: 0, signal: null }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      );
    await expect(new CodeCompilerRunner().execute('pass', '')).resolves.toMatchObject({
      outputLimited: true,
    });
  });
});

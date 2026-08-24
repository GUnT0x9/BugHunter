import { describe, expect, it } from 'vitest';
import { buildContainerOptions, JUDGE_LIMITS } from './docker-runner.js';

describe('Docker runner isolation options', () => {
  it('disables networking and sets bounded resources', () => {
    const options = buildContainerOptions('python:3.12-alpine', 'print(input())', 'BugHunter\n');
    expect(options.HostConfig.NetworkMode).toBe('none');
    expect(options.HostConfig.ReadonlyRootfs).toBe(true);
    expect(options.HostConfig.Memory).toBe(JUDGE_LIMITS.memoryBytes);
    expect(options.HostConfig.MemorySwap).toBe(JUDGE_LIMITS.memoryBytes);
    expect(options.HostConfig.PidsLimit).toBe(JUDGE_LIMITS.pidsLimit);
    expect(options.HostConfig.CapDrop).toEqual(['ALL']);
    expect(options.HostConfig.SecurityOpt).toContain('no-new-privileges:true');
    expect(options.User).toBe('65534:65534');
    expect(options.OpenStdin).toBe(false);
    expect(options.Cmd).toContain('-I');
    expect(options.Cmd).toContain('-B');
    expect(options.Cmd.at(-1)).toBe('BugHunter\n');
  });
});

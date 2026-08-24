import { loadEnvFile } from 'node:process';
import { missions as contentMissions } from '../packages/content/dist/index.js';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5173/api';
const TERMINAL_STATUSES = new Set(['SUCCEEDED', 'FAILED', 'ERROR', 'TIMED_OUT']);
const POLL_TIMEOUT_MS = 30_000;

try {
  loadEnvFile();
} catch (error) {
  if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function parseResponse(response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body ? body.message : response.statusText;
    throw new Error(`${response.status} ${String(message)}`);
  }
  return body;
}

async function request(path, cookie, init) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
      ...(init?.headers ?? {}),
    },
  });
  return { response, body: await parseResponse(response) };
}

async function login() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set.');
  const { response, body } = await request('/auth/login', '', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (body?.role !== 'ADMIN') throw new Error('Configured account is not an admin.');
  const cookie = response.headers.get('set-cookie')?.split(';', 1)[0];
  if (!cookie) throw new Error('Login response did not include a session cookie.');
  return cookie;
}

async function waitForExecution(executionId, cookie) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await delay(500);
    const { body } = await request(`/executions/${executionId}`, cookie);
    if (TERMINAL_STATUSES.has(body.status)) return body;
  }
  throw new Error(`Execution timed out while polling: ${executionId}`);
}

function validateResult(mission, result) {
  const issues = [];
  if (result.status !== 'SUCCEEDED') issues.push(`status=${result.status}`);
  if (result.errorKind !== 'NONE') issues.push(`errorKind=${result.errorKind}`);
  if (result.tests.length !== mission.tests.length) issues.push(`tests=${result.tests.length}`);
  if (result.tests.some((test) => !test.passed)) issues.push('failed test');
  const hidden = result.tests.find((test) => test.isHidden);
  if (!hidden) issues.push('hidden result missing');
  if (hidden && ['input', 'expectedOutput', 'actualOutput'].some((key) => key in hidden)) {
    issues.push('hidden test values leaked');
  }
  return issues;
}

async function main() {
  const cookie = await login();
  const { body: publicMissions } = await request('/missions', cookie);
  const publicBySlug = new Map(publicMissions.map((mission) => [mission.slug, mission]));
  if (publicMissions.length !== contentMissions.length) {
    throw new Error(
      `Mission count mismatch: API=${publicMissions.length}, content=${contentMissions.length}`,
    );
  }
  if (publicMissions.some((mission) => mission.isLocked)) {
    throw new Error('At least one Mission is locked for the admin account.');
  }

  const failures = [];
  for (const [index, mission] of contentMissions.entries()) {
    const publicMission = publicBySlug.get(mission.slug);
    if (!publicMission) {
      failures.push(`${mission.slug}: missing from API`);
      continue;
    }
    const { body: job } = await request(`/missions/${publicMission.id}/submissions`, cookie, {
      method: 'POST',
      body: JSON.stringify({ code: mission.referenceSolution }),
    });
    const result = await waitForExecution(job.executionId, cookie);
    const issues = validateResult(mission, result);
    if (issues.length > 0) failures.push(`${mission.slug}: ${issues.join(', ')}`);
    process.stdout.write(
      `[${index + 1}/${contentMissions.length}] ${mission.slug} ${result.status}\n`,
    );
    await delay(500);
  }

  if (failures.length > 0)
    throw new Error(`API content validation failed:\n${failures.join('\n')}`);
  process.stdout.write(
    `Validated ${contentMissions.length} Mission submissions through ${API_BASE_URL}.\n`,
  );
}

await main();

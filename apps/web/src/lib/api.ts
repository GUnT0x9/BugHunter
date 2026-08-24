import type {
  ExecutionResult,
  LoginInput,
  MissionPublic,
  RegisterInput,
  User,
} from '@bughunter/contracts';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      ...init,
    });
  } catch {
    throw new Error('API 서버에 연결할 수 없습니다. 서버 실행 상태를 확인해주세요.');
  }
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String(payload.message)
        : '요청을 처리하지 못했습니다.';
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export const api = {
  me: () => request<User>('/auth/me'),
  login: (input: LoginInput) =>
    request<User>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  register: (input: RegisterInput) =>
    request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
  missions: () => request<MissionPublic[]>('/missions'),
  mission: (id: string) => request<MissionPublic>(`/missions/${id}`),
  run: (missionId: string, code: string) =>
    request<{ executionId: string }>(`/missions/${missionId}/runs`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  submit: (missionId: string, code: string) =>
    request<{ executionId: string; submissionId: string }>(`/missions/${missionId}/submissions`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  execution: (executionId: string) => request<ExecutionResult>(`/executions/${executionId}`),
  hint: (missionId: string, level: number) =>
    request<{ ok: true }>(`/missions/${missionId}/hints/${level}`, { method: 'POST' }),
  progress: () =>
    request<{
      totalXp: number;
      level: number;
      xpIntoLevel: number;
      xpForNextLevel: number;
      bugsFixed: number;
      streak: number;
      continueMission: {
        id: string;
        title: string;
        chapterTitle: string;
        chapterOrder: number;
      } | null;
    }>('/progress'),
  bugdex: () =>
    request<Array<{ discoveredCount: number; bugType: { name: string; description: string } }>>(
      '/bugdex',
    ),
  statistics: () =>
    request<{
      solvedCount: number;
      totalSubmissions: number;
      averageAttempts: number;
      executionTimeMs: number;
      bugSkills: Array<{ name: string; fixedCount: number }>;
    }>('/statistics'),
};

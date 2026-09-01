import type {
  ExecutionResult,
  CommunityUser,
  FriendOverview,
  LoginInput,
  MissionPublic,
  ProfileSummary,
  ProfileUpdate,
  RankingResponse,
  RegisterInput,
  User,
} from '@bughunter/contracts';
import type { AdminMission, AdminMissionDraft, AdminValidationReport } from './admin-types.js';

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
  updateProfile: (input: ProfileUpdate) =>
    request<User>('/auth/me', { method: 'PATCH', body: JSON.stringify(input) }),
  profileSummary: () => request<ProfileSummary>('/profile-summary'),
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
  run: (missionId: string, code: string, input: string) =>
    request<{ executionId: string }>(`/missions/${missionId}/runs`, {
      method: 'POST',
      body: JSON.stringify({ code, input }),
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
  rankings: () => request<RankingResponse>('/community/rankings'),
  searchUsers: (query: string) =>
    request<CommunityUser[]>(`/community/users?query=${encodeURIComponent(query)}`),
  friends: () => request<FriendOverview>('/community/friends'),
  requestFriend: (userId: string) =>
    request<CommunityUser>(`/community/friends/${userId}`, { method: 'POST' }),
  acceptFriend: (friendshipId: string) =>
    request<CommunityUser>(`/community/friendships/${friendshipId}/accept`, { method: 'POST' }),
  removeFriendship: (friendshipId: string) =>
    request<{ ok: true }>(`/community/friendships/${friendshipId}`, { method: 'DELETE' }),
  adminMissions: () => request<AdminMission[]>('/admin/missions'),
  updateAdminMission: (id: string, input: AdminMissionDraft) =>
    request<{ id: string }>(`/admin/missions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  duplicateAdminMission: (id: string) =>
    request<{ id: string }>(`/admin/missions/${id}/duplicate`, { method: 'POST' }),
  validateAdminMission: (id: string) =>
    request<AdminValidationReport>(`/admin/missions/${id}/validate`, { method: 'POST' }),
  publishAdminMission: (id: string) =>
    request<{ id: string }>(`/admin/missions/${id}/publish`, { method: 'PATCH' }),
  unpublishAdminMission: (id: string) =>
    request<{ id: string }>(`/admin/missions/${id}/unpublish`, { method: 'PATCH' }),
};

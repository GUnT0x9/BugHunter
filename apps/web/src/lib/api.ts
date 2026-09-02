import type {
  ExecutionResult,
  CommunityUser,
  FollowOverview,
  LoginInput,
  MissionPublic,
  ProfileSummary,
  PublicProfile,
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
  publicProfile: (userId: string) => request<PublicProfile>(`/community/users/${userId}`),
  follows: (userId: string) => request<FollowOverview>(`/community/users/${userId}/follows`),
  follow: (userId: string) =>
    request<{ ok: true }>(`/community/users/${userId}/follow`, { method: 'POST' }),
  unfollow: (userId: string) =>
    request<{ ok: true }>(`/community/users/${userId}/follow`, { method: 'DELETE' }),
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
    request<
      Array<{
        completedAt: string;
        attempts: number;
        highestHint: number;
        rating: { stars: number; cleared: boolean; noHint: boolean; firstTry: boolean };
        reviewAvailableAt: string;
        mastered: boolean;
        mission: {
          id: string;
          title: string;
          description: string;
          difficulty: number;
          isBoss: boolean;
          baseXp: number;
          sortOrder: number;
          chapter: { sortOrder: number; title: string };
          bugType: { slug: string; name: string };
        };
      }>
    >('/bugdex'),
  mastery: () =>
    request<
      Array<{
        slug: string;
        name: string;
        missionCount: number;
        completedCount: number;
        earnedStars: number;
        totalStars: number;
        percentage: number;
      }>
    >('/mastery'),
  achievements: () =>
    request<{
      unlockedCount: number;
      totalCount: number;
      items: Array<{
        code: string;
        group: string;
        title: string;
        description: string;
        target: number;
        progress: number;
        secret?: boolean;
        comingSoon?: boolean;
        rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
        unlocked: boolean;
      }>;
    }>('/achievements'),
  quests: () =>
    request<{
      dailyEndsAt: string;
      weeklyEndsAt: string;
      quests: Array<{
        key: string;
        period: 'DAILY' | 'WEEKLY';
        title: string;
        description: string;
        progress: number;
        target: number;
        rewardXp: number;
        completed: boolean;
        claimed: boolean;
      }>;
    }>('/quests'),
  claimQuest: (questKey: string) =>
    request<{ ok: true; awardedXp: number }>('/quests/claim', {
      method: 'POST',
      body: JSON.stringify({ questKey }),
    }),
  cooperativeChallenge: () =>
    request<{
      key: string;
      title: string;
      description: string;
      startsAt: string;
      endsAt: string;
      globalProgress: number;
      globalTarget: number;
      contribution: number;
      contributorCount: number;
      rewardXp: number;
      completed: boolean;
      claimed: boolean;
    }>('/challenges/cooperative'),
  claimCooperativeChallenge: () =>
    request<{ ok: true; awardedXp: number }>('/challenges/cooperative/claim', { method: 'POST' }),
  statistics: () =>
    request<{
      solvedCount: number;
      totalSubmissions: number;
      averageAttempts: number;
      executionTimeMs: number;
      bugSkills: Array<{ name: string; fixedCount: number }>;
    }>('/statistics'),
  rankings: () => request<RankingResponse>('/community/rankings'),
  weeklyComparison: () =>
    request<{
      startsAt: string;
      endsAt: string;
      entries: Array<{
        id: string;
        username: string;
        isSelf: boolean;
        solvedCount: number;
        earnedStars: number;
        rank: number;
      }>;
    }>('/community/weekly-comparison'),
  seasonRankings: () =>
    request<{
      season: { key: string; number: number; startsAt: string; endsAt: string };
      entries: Array<{
        id: string;
        username: string;
        isSelf: boolean;
        earnedStars: number;
        solvedCount: number;
        averageSolveTimeSeconds: number;
        perfectCount: number;
        totalAttempts: number;
        rank: number;
      }>;
      me: {
        id: string;
        username: string;
        isSelf: boolean;
        earnedStars: number;
        solvedCount: number;
        averageSolveTimeSeconds: number;
        perfectCount: number;
        totalAttempts: number;
        rank: number;
      };
    }>('/community/season-rankings'),
  searchUsers: (query: string) =>
    request<CommunityUser[]>(`/community/users?query=${encodeURIComponent(query)}`),
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

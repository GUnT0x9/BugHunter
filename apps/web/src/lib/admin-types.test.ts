import { describe, expect, it } from 'vitest';
import {
  createAdminMissionDraft,
  normalizeAdminMissionDraft,
  type AdminMission,
} from './admin-types.js';

const BASE_MISSION: AdminMission = {
  id: 'mission-1',
  slug: 'first-bug',
  chapterId: 'chapter-1',
  sortOrder: 1,
  title: '첫 번째 버그',
  description: '첫 번째 버그를 고치는 미션입니다.',
  language: 'python',
  difficulty: 2,
  isBoss: false,
  bugTypeId: 'bug-type-1',
  initialCode: 'print("bug")',
  referenceSolution: 'print("fixed")',
  explanation: '출력할 문자열을 올바르게 수정합니다.',
  baseXp: 100,
  isPublished: true,
  createdAt: '2026-08-24T00:00:00.000Z',
  updatedAt: '2026-08-24T00:00:00.000Z',
  chapter: {
    id: 'chapter-1',
    slug: 'chapter-one',
    sortOrder: 1,
    title: 'Chapter 1',
    description: '첫 번째 Chapter',
  },
  bugType: {
    id: 'bug-type-1',
    slug: 'output',
    name: '출력 오류',
    description: '잘못된 출력을 찾습니다.',
  },
  tests: [
    {
      id: 'test-1',
      missionId: 'mission-1',
      sortOrder: 1,
      input: '',
      expectedOutput: 'fixed',
      isHidden: true,
    },
  ],
  hints: [{ id: 'hint-1', missionId: 'mission-1', level: 1, content: '문자열을 확인하세요.' }],
  concepts: [
    {
      missionId: 'mission-1',
      conceptId: 'concept-1',
      concept: { id: 'concept-1', slug: 'print', name: 'print' },
    },
  ],
};

describe('createAdminMissionDraft', () => {
  it('관리자 API 응답을 저장 가능한 편집 초안으로 변환한다', () => {
    const draft = createAdminMissionDraft(BASE_MISSION);

    expect(draft).toMatchObject({
      chapterId: 'chapter-1',
      bugTypeId: 'bug-type-1',
      title: '첫 번째 버그',
      tests: [{ input: '', expectedOutput: 'fixed', isHidden: true }],
      hints: ['문자열을 확인하세요.'],
      concepts: ['print'],
    });
    expect(draft.tests[0]).not.toBe(BASE_MISSION.tests[0]);
  });

  it('선택 데이터가 없는 관계 목록도 빈 편집 목록으로 유지한다', () => {
    const draft = createAdminMissionDraft({
      ...BASE_MISSION,
      tests: [],
      hints: [],
      concepts: [],
    });

    expect(draft.tests).toEqual([]);
    expect(draft.hints).toEqual([]);
    expect(draft.concepts).toEqual([]);
  });
});

describe('normalizeAdminMissionDraft', () => {
  it('개념의 앞뒤 공백과 편집 중 생긴 빈 줄을 저장 전에 제거한다', () => {
    const draft = createAdminMissionDraft(BASE_MISSION);

    expect(
      normalizeAdminMissionDraft({ ...draft, concepts: [' print ', '', '  반복문  '] }).concepts,
    ).toEqual(['print', '반복문']);
    expect(draft.concepts).toEqual(['print']);
  });

  it('공백 개념만 입력된 경우 빈 목록으로 정규화한다', () => {
    const draft = createAdminMissionDraft(BASE_MISSION);

    expect(normalizeAdminMissionDraft({ ...draft, concepts: [' ', '\t'] }).concepts).toEqual([]);
  });
});

export type AdminMissionTest = {
  id: string;
  missionId: string;
  sortOrder: number;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
};

export type AdminMissionHint = {
  id: string;
  missionId: string;
  level: number;
  content: string;
};

export type AdminMission = {
  id: string;
  slug: string;
  chapterId: string;
  sortOrder: number;
  title: string;
  description: string;
  language: string;
  difficulty: number;
  isBoss: boolean;
  bugTypeId: string;
  initialCode: string;
  referenceSolution: string;
  explanation: string;
  baseXp: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  chapter: {
    id: string;
    slug: string;
    sortOrder: number;
    title: string;
    description: string;
  };
  bugType: {
    id: string;
    slug: string;
    name: string;
    description: string;
  };
  tests: AdminMissionTest[];
  hints: AdminMissionHint[];
  concepts: Array<{
    missionId: string;
    conceptId: string;
    concept: { id: string; slug: string; name: string };
  }>;
};

export type AdminMissionDraft = {
  chapterId: string;
  bugTypeId: string;
  slug: string;
  sortOrder: number;
  title: string;
  description: string;
  difficulty: number;
  isBoss: boolean;
  initialCode: string;
  referenceSolution: string;
  explanation: string;
  baseXp: number;
  tests: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
  hints: string[];
  concepts: string[];
};

export type AdminValidationReport = { ready: boolean; issues: string[] };

export function createAdminMissionDraft(mission: AdminMission): AdminMissionDraft {
  return {
    chapterId: mission.chapterId,
    bugTypeId: mission.bugTypeId,
    slug: mission.slug,
    sortOrder: mission.sortOrder,
    title: mission.title,
    description: mission.description,
    difficulty: mission.difficulty,
    isBoss: mission.isBoss,
    initialCode: mission.initialCode,
    referenceSolution: mission.referenceSolution,
    explanation: mission.explanation,
    baseXp: mission.baseXp,
    tests: mission.tests.map((test) => ({
      input: test.input,
      expectedOutput: test.expectedOutput,
      isHidden: test.isHidden,
    })),
    hints: mission.hints.map((hint) => hint.content),
    concepts: mission.concepts.map((item) => item.concept.name),
  };
}

export function normalizeAdminMissionDraft(draft: AdminMissionDraft): AdminMissionDraft {
  return {
    ...draft,
    concepts: draft.concepts
      .map((concept) => concept.trim())
      .filter((concept) => concept.length > 0),
  };
}

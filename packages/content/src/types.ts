import type { TestCase } from '@bughunter/contracts';

export type BugTypeSeed = {
  slug: string;
  name: string;
  description: string;
};

export type MissionSeed = {
  slug: string;
  chapterOrder: number;
  order: number;
  title: string;
  description: string;
  difficulty: number;
  isBoss: boolean;
  bugTypeSlug: string;
  initialCode: string;
  referenceSolution: string;
  tests: Omit<TestCase, 'id'>[];
  hints: [string, string, string];
  explanation: string;
  concepts: string[];
  baseXp: number;
};

export type ChapterSeed = {
  order: number;
  slug: string;
  title: string;
  description: string;
};

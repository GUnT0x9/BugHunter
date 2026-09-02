// noqa: SIZE_OK - re-export hub aggregating split chapter modules; pure data aggregation
import type { MissionSeed } from './types.js';
import { bugTypes } from './bugTypes.js';
import { chapters } from './chapters.js';
import { chapter1Missions } from './missions/chapter1.js';
import { chapter2Missions } from './missions/chapter2.js';
import { chapter3Missions } from './missions/chapter3.js';
import { chapter4Missions } from './missions/chapter4.js';
import { chapter5Missions } from './missions/chapter5.js';
import { chapter6Missions } from './missions/chapter6.js';
import { chapter7Missions } from './missions/chapter7.js';

export type { BugTypeSeed, MissionSeed, ChapterSeed } from './types.js';
export { bugTypes } from './bugTypes.js';
export { chapters } from './chapters.js';

export const missions: MissionSeed[] = [
  ...chapter1Missions,
  ...chapter2Missions,
  ...chapter3Missions,
  ...chapter4Missions,
  ...chapter5Missions,
  ...chapter6Missions,
  ...chapter7Missions,
];

export function validateContentShape(): string[] {
  const errors: string[] = [];
  if (missions.length !== 45) errors.push(`Mission 수가 45가 아닙니다: ${missions.length}`);
  const slugSet = new Set<string>();
  const validBugTypes = new Set(bugTypes.map((b) => b.slug));
  for (const chapter of chapters) {
    const items = missions.filter((mission) => mission.chapterOrder === chapter.order);
    if (items.length === 0 || !items.at(-1)?.isBoss)
      errors.push(`${chapter.title}의 Boss Mission이 없습니다.`);
    const orders = new Set(items.map((m) => m.order));
    if (orders.size !== items.length) errors.push(`${chapter.title}의 order가 중복됩니다.`);
  }
  for (const mission of missions) {
    if (slugSet.has(mission.slug)) errors.push(`${mission.slug} slug가 중복됩니다.`);
    slugSet.add(mission.slug);
    if (!validBugTypes.has(mission.bugTypeSlug))
      errors.push(`${mission.slug}의 bugTypeSlug가 유효하지 않습니다: ${mission.bugTypeSlug}`);
    if (mission.tests.length < 3) errors.push(`${mission.slug}의 테스트가 3개 미만입니다.`);
    if (!mission.tests.at(-1)?.isHidden)
      errors.push(`${mission.slug}의 마지막 테스트는 hidden이어야 합니다.`);
    const testPairs = new Set<string>();
    const testInputs = new Set<string>();
    let hiddenStarted = false;
    for (const [index, test] of mission.tests.entries()) {
      if (test.order !== index + 1)
        errors.push(`${mission.slug}의 테스트 order가 연속적이지 않습니다.`);
      if (hiddenStarted && !test.isHidden)
        errors.push(`${mission.slug}의 공개 테스트가 숨김 테스트 뒤에 있습니다.`);
      hiddenStarted ||= test.isHidden;
      const pair = JSON.stringify([test.input, test.expectedOutput]);
      if (testPairs.has(pair)) errors.push(`${mission.slug}에 중복된 입출력 테스트가 있습니다.`);
      testPairs.add(pair);
      if (testInputs.has(test.input))
        errors.push(`${mission.slug}에 중복된 테스트 입력이 있습니다.`);
      testInputs.add(test.input);
    }
    if (mission.hints.length !== 3) errors.push(`${mission.slug}의 힌트가 3개가 아닙니다.`);
    for (const h of mission.hints)
      if (!h || h.trim().length === 0) errors.push(`${mission.slug}의 힌트가 비어 있습니다.`);
    if (mission.concepts.length === 0) errors.push(`${mission.slug}의 concepts가 비어 있습니다.`);
    if (mission.baseXp <= 0) errors.push(`${mission.slug}의 baseXp가 0 이하입니다.`);
    if (mission.difficulty < 1 || mission.difficulty > 5)
      errors.push(`${mission.slug}의 difficulty가 1-5 범위가 아닙니다.`);
    if (mission.initialCode.trim() === mission.referenceSolution.trim())
      errors.push(`${mission.slug}의 initialCode와 referenceSolution이 동일합니다.`);
    if (mission.initialCode.includes('\0') || mission.referenceSolution.includes('\0'))
      errors.push(`${mission.slug}에 null 문자가 포함되어 있습니다.`);
    if (mission.description.trim().length < 20)
      errors.push(`${mission.slug}의 설명이 너무 짧습니다.`);
    if (mission.explanation.trim().length < 10)
      errors.push(`${mission.slug}의 해설이 너무 짧습니다.`);
  }
  return errors;
}

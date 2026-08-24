export type MissionValidationInput = {
  initialCode: string;
  referenceSolution: string;
  tests: ReadonlyArray<unknown>;
  hints: ReadonlyArray<unknown>;
  concepts: ReadonlyArray<unknown>;
};

export type MissionValidationReport = { ready: boolean; issues: string[] };

export function validateMissionShape(input: MissionValidationInput): MissionValidationReport {
  const issues: string[] = [];
  const initial = input.initialCode.trim();
  const reference = input.referenceSolution.trim();
  if (initial.length === 0) issues.push('초기 버그 코드가 비어 있습니다.');
  if (reference.length === 0) issues.push('reference solution이 비어 있습니다.');
  if (initial === reference) issues.push('초기 코드와 reference solution이 동일합니다.');
  if (initial.includes('\0') || reference.includes('\0'))
    issues.push('코드에는 null 문자를 포함할 수 없습니다.');
  if (input.initialCode.length > 64 * 1024 || input.referenceSolution.length > 64 * 1024)
    issues.push('코드는 64KB 이하여야 합니다.');
  if (input.tests.length < 3) issues.push('Test Case는 최소 3개가 필요합니다.');
  const tests = input.tests as Array<{ input?: string; expectedOutput?: string; isHidden?: boolean }>;
  if (tests.length >= 3 && !tests[tests.length - 1]?.isHidden)
    issues.push('마지막 테스트는 숨김(hidden) 테스트여야 합니다.');
  const seen = new Set<string>();
  for (const t of tests) {
    const key = `${t.input ?? ''}|||${t.expectedOutput ?? ''}`;
    if (seen.has(key)) issues.push('중복된 입출력 테스트가 있습니다.');
    seen.add(key);
  }
  if (input.hints.length !== 3) issues.push('단계별 Hint는 정확히 3개가 필요합니다.');
  for (const [idx, hint] of input.hints.entries()) {
    if (typeof hint !== 'string' || (hint as string).trim().length === 0)
      issues.push(`Hint ${idx + 1}이 비어 있습니다.`);
    if (typeof hint === 'string' && (hint as string).length > 500)
      issues.push(`Hint ${idx + 1}이 너무 깁니다. 500자 이하여야 합니다.`);
  }
  if (input.concepts.length === 0) issues.push('관련 Concept을 하나 이상 연결해야 합니다.');
  if (input.concepts.length > 8) issues.push('Concept은 8개 이하여야 합니다.');
  for (const concept of input.concepts as string[]) {
    if (typeof concept !== 'string' || concept.trim().length === 0)
      issues.push('빈 Concept이 포함되어 있습니다.');
  }
  return { ready: issues.length === 0, issues };
}

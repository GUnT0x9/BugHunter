import { normalizeOutput } from '@bughunter/contracts';
import { missions } from '@bughunter/content';
import Docker from 'dockerode';
import { DockerRunner } from './docker-runner.js';
import { loadWorkerEnv } from './env.js';

const env = loadWorkerEnv();
const runner = new DockerRunner(new Docker(), env.JUDGE_IMAGE);
const failures: string[] = [];

for (const mission of missions) {
  let initialFailed = false;
  for (const test of mission.tests) {
    const initial = await runner.execute(mission.initialCode, test.input);
    if (
      initial.exitCode !== 0 ||
      initial.timedOut ||
      initial.outputLimited ||
      normalizeOutput(initial.stdout) !== normalizeOutput(test.expectedOutput)
    ) {
      initialFailed = true;
      break;
    }
  }
  if (!initialFailed) failures.push(`${mission.slug}: 초기 코드가 모든 테스트를 통과함`);

  for (const test of mission.tests) {
    const reference = await runner.execute(mission.referenceSolution, test.input);
    const passed =
      reference.exitCode === 0 &&
      !reference.timedOut &&
      !reference.outputLimited &&
      normalizeOutput(reference.stdout) === normalizeOutput(test.expectedOutput);
    if (!passed) failures.push(`${mission.slug}: reference solution이 Test ${test.order}에서 실패`);
  }
}

if (failures.length > 0) {
  throw new Error(`Docker content validation failed:\n${failures.join('\n')}`);
}

process.stdout.write(`Validated ${missions.length} missions with ${env.JUDGE_IMAGE}.\n`);

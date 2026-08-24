import type { ExecutionDiagnostic, ExecutionErrorKind } from '@bughunter/contracts';

const ERROR_LINE_PATTERN = /^([A-Za-z_][A-Za-z0-9_]*(?:Error|Exception))(?::\s*(.*))?$/;
const FILE_LINE_PATTERN = /File "main\.py", line (\d+)/g;

function lastSourceLine(stderr: string): number | null {
  let line: number | null = null;
  for (const match of stderr.matchAll(FILE_LINE_PATTERN)) line = Number(match[1]);
  return line;
}

function syntaxColumn(stderr: string): number | null {
  const lines = stderr.split('\n');
  const fileLineIndex = lines.findIndex((line) => /File "main\.py", line \d+/.test(line));
  if (fileLineIndex < 0) return null;
  const caretLine = lines.slice(fileLineIndex + 1).find((line) => line.includes('^'));
  if (!caretLine) return null;
  return caretLine.indexOf('^') + 1;
}

function lastErrorMessage(stderr: string): string | null {
  for (const line of stderr.trim().split('\n').reverse()) {
    const match = line.trim().match(ERROR_LINE_PATTERN);
    if (match) return match[2] ? `${match[1]}: ${match[2]}` : (match[1] ?? null);
  }
  return null;
}

export function parsePythonDiagnostic(
  errorKind: ExecutionErrorKind,
  stderr: string,
): ExecutionDiagnostic | null {
  if (errorKind === 'NONE') return null;
  if (errorKind === 'TIMEOUT') {
    return {
      kind: 'TIMEOUT',
      message: '실행 시간이 3초를 초과했습니다.',
      line: null,
      column: null,
    };
  }
  if (errorKind === 'OUTPUT_LIMIT') {
    return {
      kind: 'OUTPUT_LIMIT',
      message: '출력이 64KB 제한을 초과했습니다.',
      line: null,
      column: null,
    };
  }
  if (errorKind === 'INTERNAL_ERROR') {
    return {
      kind: 'INTERNAL_ERROR',
      message: '채점 환경에서 오류가 발생했습니다.',
      line: null,
      column: null,
    };
  }
  return {
    kind: errorKind,
    message: lastErrorMessage(stderr) ?? 'Python 실행 중 오류가 발생했습니다.',
    line: lastSourceLine(stderr),
    column: errorKind === 'SYNTAX_ERROR' ? syntaxColumn(stderr) : null,
  };
}

export function sanitizePythonStderr(stderr: string): string {
  return stderr
    .split('\n')
    .filter((line) => !line.includes('File "<string>"'))
    .join('\n')
    .trim();
}

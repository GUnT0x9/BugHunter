import { describe, expect, it } from 'vitest';
import { parsePythonDiagnostic, sanitizePythonStderr } from './python-diagnostic.js';

describe('Python diagnostics', () => {
  it('extracts a syntax error location and message', () => {
    const stderr = `  File "main.py", line 2\n    print("broken"\n                  ^\nSyntaxError: '(' was never closed\n`;
    expect(parsePythonDiagnostic('SYNTAX_ERROR', stderr)).toEqual({
      kind: 'SYNTAX_ERROR',
      message: "SyntaxError: '(' was never closed",
      line: 2,
      column: 19,
    });
  });

  it('extracts the last user-code frame for runtime errors', () => {
    const stderr = `Traceback (most recent call last):\n  File "<string>", line 1, in <module>\n  File "main.py", line 4, in <module>\nZeroDivisionError: division by zero\n`;
    expect(parsePythonDiagnostic('RUNTIME_ERROR', stderr)).toMatchObject({
      kind: 'RUNTIME_ERROR',
      line: 4,
      message: 'ZeroDivisionError: division by zero',
    });
    expect(sanitizePythonStderr(stderr)).not.toContain('<string>');
  });

  it('returns a stable timeout message without a location', () => {
    expect(parsePythonDiagnostic('TIMEOUT', '')).toMatchObject({
      kind: 'TIMEOUT',
      line: null,
      column: null,
    });
  });
});

// noqa: SIZE_OK - single screen component with tightly coupled execution state; splitting would fragment prop drilling and is deferred
import { useEffect, useState, type ReactElement } from 'react';
import Editor, { type BeforeMount } from '@monaco-editor/react';
import { CircleHelp, FileCode2, Play, Send, Sparkles } from 'lucide-react';
import type { ExecutionResult, MissionPublic } from '@bughunter/contracts';
import { api } from '../lib/api.js';
import { installBugHunterTheme } from '../lib/monaco-theme.js';
import { Panel } from './ui/Panel.js';

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
const EXECUTION_POLL_TIMEOUT_MS = 120_000;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
}

type WorkspaceProps = {
  mission: MissionPublic;
  onBack: () => void;
  onComplete: () => void;
};

const beforeMount: BeforeMount = (monaco) => {
  installBugHunterTheme(monaco);
};

export function Workspace({ mission, onBack, onComplete }: WorkspaceProps): ReactElement {
  const [code, setCode] = useState(mission.initialCode);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [guide, setGuide] = useState<'hint' | 'tests' | 'learn'>('hint');

  useEffect(() => {
    setCode(mission.initialCode);
    setResult(null);
    setHintLevel(0);
    setError('');
    setGuide('hint');
    setBusy(false);
  }, [mission.id, mission.initialCode]);

  const execute = async (kind: 'run' | 'submit'): Promise<void> => {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const job =
        kind === 'run' ? await api.run(mission.id, code) : await api.submit(mission.id, code);
      let next: ExecutionResult | null = null;
      const pollingStartedAt = Date.now();
      let pollingIntervalMs = 500;
      while (Date.now() - pollingStartedAt < EXECUTION_POLL_TIMEOUT_MS) {
        await delay(pollingIntervalMs);
        next = await api.execution(job.executionId);
        setResult(next);
        if (!['QUEUED', 'RUNNING'].includes(next.status)) break;
        pollingIntervalMs = 1_000;
      }
      if (!next || ['QUEUED', 'RUNNING'].includes(next.status))
        throw new Error('실행 시간이 초과되었습니다. 잠시 후 다시 확인하세요.');
      setResult(next);
      if (next.completed) onComplete();
    } catch (requestError: unknown) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const currentHint = hintLevel ? mission.hints[hintLevel - 1] : null;
  const allPassed = result?.kind === 'SUBMIT' && result.status === 'SUCCEEDED';
  const isPending = result ? ['QUEUED', 'RUNNING'].includes(result.status) : false;
  const statusLed = isPending ? (result?.status === 'RUNNING' ? 'run' : 'queued') : '';

  return (
    <main className="workspace">
      <header className="workspace-header">
        <button className="btn ghost" onClick={onBack}>
          ← 목록으로
        </button>
        <span className="wh-mission">
          CH.{mission.chapterOrder}-M.{mission.order}
        </span>
        <h1>{mission.title}</h1>
        <span className="wh-right">
          <span className="tag green">{mission.bugType.name}</span>
          {mission.isBoss && <span className="tag amber">보스</span>}
          <span className="tag">
            {'★'.repeat(mission.difficulty)}
            <span className="star-off">{'★'.repeat(5 - mission.difficulty)}</span>
          </span>
          <span className="tag">Python 3.12</span>
        </span>
      </header>

      <div className="workspace-grid">
        <Panel title="문제" className="problem-panel">
          <h1>{mission.title}</h1>
          <p className="p-desc" style={{ whiteSpace: 'pre-wrap', wordBreak: 'keep-all' }}>
            {mission.description}
          </p>
          <h3>입력 / 출력 명세</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            <div>
              <div
                style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4, fontWeight: 700 }}
              >
                입력 예시
              </div>
              <pre className="expected-box" style={{ color: 'var(--text-dim)' }}>
                {mission.visibleTests[0]?.input?.trim()
                  ? mission.visibleTests[0]?.input
                  : '(입력 없음)'}
              </pre>
            </div>
            <div>
              <div
                style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4, fontWeight: 700 }}
              >
                기대 출력
              </div>
              <pre className="expected-box">
                {mission.visibleTests[0]?.expectedOutput ?? '테스트에서 확인하세요.'}
              </pre>
            </div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-faint)' }}>
            테스트 {mission.visibleTests.length}개 중 {mission.visibleTests.length}개 공개 · 숨김
            테스트는 제출 시 검증됩니다.
          </div>
          <h3>관련 개념</h3>
          <div className="concept-tags">
            {mission.concepts.map((concept) => (
              <span className="tag" key={concept}>
                {concept}
              </span>
            ))}
          </div>
        </Panel>

        <section className="editor-panel">
          <div className="editor-header">
            <span className="eh-file">
              <FileCode2 /> main.py
            </span>
            <button
              className="btn ghost"
              style={{ marginLeft: 12, padding: '4px 8px', fontSize: 12 }}
              onClick={() => setCode(mission.initialCode)}
              title="버그가 포함된 초기 코드로 되돌립니다"
            >
              초기 코드로 되돌리기
            </button>
            <span className="eh-right">Python 3.12</span>
          </div>
          <div className="editor-body">
            <Editor
              height="100%"
              defaultLanguage="python"
              theme="bughunter-terminal"
              beforeMount={beforeMount}
              value={code}
              onChange={(value) => setCode(value ?? '')}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                automaticLayout: true,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Pretendard', monospace",
                fontLigatures: true,
              }}
            />
          </div>
        </section>

        <Panel title="가이드" className="guide-panel">
          <div className="guide-tabs">
            {(['hint', 'tests', 'learn'] as const).map((tab) => (
              <button
                className={guide === tab ? 'active' : ''}
                onClick={() => setGuide(tab)}
                key={tab}
              >
                {tab === 'hint' ? '힌트' : tab === 'tests' ? '테스트' : '학습'}
              </button>
            ))}
          </div>
          <div className="guide-content">
            {guide === 'hint' && (
              <>
                <h3>
                  <CircleHelp size={13} /> 힌트 {hintLevel}/3
                </h3>
                {currentHint ? (
                  <>
                    <span className="hint-chip">힌트 {hintLevel}</span>
                    <p>{currentHint.content}</p>
                  </>
                ) : (
                  <p>힌트가 아직 해제되지 않았습니다. 버그의 의심 지점을 먼저 찾아보세요.</p>
                )}
                <button
                  className="btn"
                  disabled={hintLevel >= 3}
                  onClick={() => {
                    const next = Math.min(3, hintLevel + 1);
                    setHintLevel(next);
                    void api.hint(mission.id, next).catch(() => null);
                  }}
                >
                  {hintLevel ? '다음 힌트' : '힌트 보기'}
                </button>
              </>
            )}
            {guide === 'tests' && (
              <>
                <h3>테스트 결과</h3>
                {result?.tests.length ? (
                  <div className="test-list">
                    {result.tests.map((test) => (
                      <div
                        className={`test-row ${test.passed ? 'passed' : 'failed'}`}
                        key={test.order}
                      >
                        <div className="t-head">
                          <span className={`led ${test.passed ? 'ok' : 'fail'}`} />
                          <span className="t-name">
                            테스트 {test.order}
                            {test.isHidden ? ' · 숨김' : ''}
                          </span>
                          <span className="t-verdict">{test.passed ? '통과' : '실패'}</span>
                        </div>
                        {!test.isHidden && !test.passed && (
                          <div className="t-diff">
                            <pre className="t-exp">
                              &lt; 기대값: {test.expectedOutput || '(빈 출력)'}
                            </pre>
                            <pre className="t-act">
                              &gt; 실제값: {test.actualOutput || '(빈 출력)'}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="test-list">
                    {mission.visibleTests.map((test) => (
                      <div className="test-row pending" key={test.id}>
                        <div className="t-head">
                          <span className="led" />
                          <span className="t-name">테스트 {test.order}</span>
                          <span className="t-verdict">대기</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {guide === 'learn' && (
              <>
                <h3>관련 개념</h3>
                <div className="concept-tags" style={{ marginBottom: 16 }}>
                  {mission.concepts.map((concept) => (
                    <span className="tag cyan" key={concept}>
                      {concept}
                    </span>
                  ))}
                </div>
                {mission.explanation ? (
                  <>
                    <h3>해설</h3>
                    <p>{mission.explanation}</p>
                  </>
                ) : (
                  <p>모든 테스트를 통과하면 해설이 열립니다.</p>
                )}
              </>
            )}
          </div>
        </Panel>
      </div>

      <section className="output-panel">
        <div className="output-header">
          <span className="oh-title">실행 결과</span>
          <span className={`oh-status ${statusLed ? 'live' : ''}`}>
            <span className={`led ${statusLed || ''}`} />
            {isPending
              ? result?.status === 'RUNNING'
                ? '실행 중…'
                : '대기 중…'
              : result
                ? allPassed
                  ? '모든 테스트 통과'
                  : '완료'
                : '대기 중'}
          </span>
          <div className="oh-actions">
            <button className="btn" disabled={busy} onClick={() => void execute('run')}>
              <Play size={14} /> 실행
            </button>
            <button className="btn primary" disabled={busy} onClick={() => void execute('submit')}>
              <Send size={14} /> 제출
            </button>
          </div>
        </div>
        <div className="output-body">
          <span className="console-line">
            <span className="cmd-prompt">$ python main.py</span>
          </span>
          {error && <span className="console-line err">오류: {error}</span>}
          {busy && !result && (
            <span className="console-line info">… 채점 작업이 대기 중입니다.</span>
          )}
          {result && !isPending && (
            <>
              {result.errorKind !== 'NONE' && (
                <span className="execution-error-kind">
                  {result.errorKind.replaceAll('_', ' ')}
                </span>
              )}
              {result.diagnostic && (
                <p className="execution-diagnostic">
                  main.py:{result.diagnostic.line}
                  {result.diagnostic.column ? `:${result.diagnostic.column}` : ''} ·{' '}
                  {result.diagnostic.message}
                </p>
              )}
              {result.kind === 'SUBMIT' &&
                result.tests.map((test) => (
                  <span className={`console-line ${test.passed ? 'ok' : 'err'}`} key={test.order}>
                    {test.passed ? '✓' : '✗'} 테스트 {test.order}
                    {test.isHidden ? ' (숨김)' : ''} — {test.passed ? '통과' : '실패'}
                  </span>
                ))}
              {result.errorKind !== 'NONE' ? (
                <span className="console-line stderr">{result.stderr}</span>
              ) : result.stdout ? (
                <span className="console-line stdout">{result.stdout}</span>
              ) : !allPassed ? (
                <span className="console-line info">출력이 없습니다.</span>
              ) : null}
              {allPassed && (
                <div className="success-banner">
                  <Sparkles />
                  <div>
                    <strong>버그를 수정했습니다!</strong>
                    <p>
                      {result.awardedXp
                        ? `+${result.awardedXp} XP 획득`
                        : '이미 완료한 Mission입니다.'}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

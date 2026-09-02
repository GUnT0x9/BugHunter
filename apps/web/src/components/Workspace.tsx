// noqa: SIZE_OK - single screen component with tightly coupled execution state; splitting would fragment prop drilling and is deferred
import { useEffect, useRef, useState, type ReactElement } from 'react';
import Editor, { type BeforeMount } from '@monaco-editor/react';
import {
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileCode2,
  FlaskConical,
  Play,
  RotateCcw,
  Send,
  Target,
  TerminalSquare,
  Trophy,
} from 'lucide-react';
import {
  MAX_MISSION_RUN_INPUT_LENGTH,
  type ExecutionResult,
  type MissionPublic,
} from '@bughunter/contracts';
import { api } from '../lib/api.js';
import { installBugHunterTheme } from '../lib/monaco-theme.js';
import { Panel } from './ui/Panel.js';

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));
const EXECUTION_POLL_TIMEOUT_MS = 300_000;

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
  const activeMissionId = useRef(mission.id);
  const [code, setCode] = useState(mission.initialCode);
  const [customInput, setCustomInput] = useState(mission.visibleTests[0]?.input ?? '');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [guide, setGuide] = useState<'problem' | 'hint' | 'tests' | 'learn'>('problem');

  useEffect(() => {
    // Completing a mission refreshes its progress data and replaces the mission object.
    // Keep the terminal result intact unless the user actually navigates to another mission.
    if (activeMissionId.current === mission.id) return;
    activeMissionId.current = mission.id;
    setCode(mission.initialCode);
    setCustomInput(mission.visibleTests[0]?.input ?? '');
    setResult(null);
    setHintLevel(0);
    setError('');
    setGuide('problem');
    setBusy(false);
  }, [mission.id, mission.initialCode, mission.visibleTests]);

  const execute = async (kind: 'run' | 'submit'): Promise<void> => {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const job =
        kind === 'run'
          ? await api.run(mission.id, code, customInput)
          : await api.submit(mission.id, code);
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
  const passedCount = result?.tests.filter((test) => test.passed).length ?? 0;
  const estimatedMinutes = Math.max(5, mission.difficulty * 4 + (mission.isBoss ? 5 : 0));
  const difficultyLabel = ['입문', '초급', '중급', '고급', '챌린지'][mission.difficulty - 1];

  return (
    <main
      className="workspace"
      onKeyDown={(event) => {
        if (busy || !(event.ctrlKey || event.metaKey) || event.key !== 'Enter') return;
        event.preventDefault();
        void execute(event.shiftKey ? 'submit' : 'run');
      }}
    >
      <header className="workspace-header">
        <button className="btn ghost" onClick={onBack}>
          ← 목록으로
        </button>
        <span className="wh-mission">
          CH.{mission.chapterOrder} / M.{mission.order}
        </span>
        <h1>{mission.title}</h1>
        <span className="wh-right">
          <span className="tag green">{mission.bugType.name}</span>
          {mission.isBoss && <span className="tag amber">보스</span>}
          <span className="tag difficulty-tag">
            LV.{mission.difficulty} · {difficultyLabel}
          </span>
          <span className="tag">Python 3.12</span>
        </span>
      </header>

      <div className="workspace-grid">
        <section className="editor-panel">
          <div className="editor-header">
            <span className="eh-file">
              <FileCode2 /> main.py <span className="unsaved-dot">●</span>
            </span>
            <button
              className="editor-reset"
              onClick={() => setCode(mission.initialCode)}
              title="버그가 포함된 초기 코드로 되돌립니다"
            >
              <RotateCcw size={12} /> 초기화
            </button>
            <span className="eh-right">UTF-8 · Python 3.12</span>
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

        <Panel title="DEBUG ASSISTANT" className="guide-panel">
          <div className="guide-tabs">
            {(['problem', 'hint', 'tests', 'learn'] as const).map((tab) => (
              <button
                className={guide === tab ? 'active' : ''}
                onClick={() => setGuide(tab)}
                key={tab}
              >
                {tab === 'problem'
                  ? '문제'
                  : tab === 'hint'
                    ? '힌트'
                    : tab === 'tests'
                      ? '테스트'
                      : '학습'}
              </button>
            ))}
          </div>
          <div className="guide-content">
            {guide === 'problem' && (
              <div className="workspace-problem-tab">
                <div className="problem-kicker">DEBUGGING CHALLENGE</div>
                <h2>{mission.title}</h2>
                <div className="mission-facts">
                  <span>
                    <Clock3 /> 약 {estimatedMinutes}분
                  </span>
                  <span>
                    <Trophy /> {mission.baseXp} XP
                  </span>
                  <span>
                    <FlaskConical /> 테스트 {mission.totalTestCount}개
                  </span>
                </div>
                <h3 className="section-heading">
                  <Target /> 해결 목표
                </h3>
                <p className="problem-tab-description">{mission.description}</p>
                <div className="debug-rule">
                  <strong>수정 규칙</strong>
                  <span>입출력 형식은 유지하고, 버그가 있는 코드만 수정하세요.</span>
                </div>
                <h3 className="section-heading">
                  <FlaskConical /> 입출력 예시
                </h3>
                <div className="sample-list">
                  {mission.visibleTests.map((test) => (
                    <article className="sample-case" key={test.id}>
                      <header>
                        <span>CASE {String(test.order).padStart(2, '0')}</span>
                        <span>PUBLIC</span>
                      </header>
                      <div className="sample-columns">
                        <div>
                          <small>INPUT</small>
                          <button
                            className="sample-input-copy"
                            onClick={() => setCustomInput(test.input)}
                            title="이 입력을 표준 입력 편집기에 복사"
                          >
                            <pre>{test.input.trim() || '(입력 없음)'}</pre>
                          </button>
                        </div>
                        <div>
                          <small>OUTPUT</small>
                          <pre>{test.expectedOutput || '(빈 출력)'}</pre>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <h3 className="section-heading">
                  <BookOpen /> 관련 개념
                </h3>
                <div className="concept-tags">
                  {mission.concepts.map((concept) => (
                    <span className="tag" key={concept}>
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {guide === 'hint' && (
              <>
                <div className="guide-summary">
                  <CircleHelp />
                  <div>
                    <strong>단계별 힌트</strong>
                    <span>정답보다 관찰 순서를 안내합니다.</span>
                  </div>
                  <b>{hintLevel}/3</b>
                </div>
                {currentHint ? (
                  <>
                    <span className="hint-chip">LEVEL {hintLevel}</span>
                    <p>{currentHint.content}</p>
                  </>
                ) : (
                  <div className="hint-locked">
                    <Target />
                    <p>
                      먼저 오류 메시지와 실패한 입력을 비교해 보세요. 막히면 힌트를 한 단계씩
                      여세요.
                    </p>
                  </div>
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
                  {hintLevel ? '다음 힌트 열기' : '첫 힌트 열기'}
                </button>
              </>
            )}
            {guide === 'tests' && (
              <>
                <div className="guide-summary">
                  <FlaskConical />
                  <div>
                    <strong>테스트 리포트</strong>
                    <span>
                      {result
                        ? `${passedCount}/${result.tests.length} 통과`
                        : '실행 후 결과를 분석하세요.'}
                    </span>
                  </div>
                </div>
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
                <div className="guide-summary">
                  <BookOpen />
                  <div>
                    <strong>학습 노트</strong>
                    <span>통과 후 원인과 수정 원리를 복습합니다.</span>
                  </div>
                </div>
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
          <span className="oh-title">
            <TerminalSquare size={15} /> CONSOLE
          </span>
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
            <button
              className="btn ghost"
              disabled={busy}
              onClick={() => setCustomInput(mission.visibleTests[0]?.input ?? '')}
            >
              <RotateCcw size={13} /> 입력 초기화
            </button>
            <button className="btn" disabled={busy} onClick={() => void execute('run')}>
              <Play size={14} /> {busy ? '실행 중…' : '직접 입력으로 실행'}
            </button>
            <button className="btn primary" disabled={busy} onClick={() => void execute('submit')}>
              <Send size={14} /> 전체 테스트 제출
            </button>
          </div>
        </div>
        <div className="output-body">
          <div className="stdin-editor">
            <label htmlFor="mission-stdin">표준 입력 (stdin)</label>
            <textarea
              id="mission-stdin"
              value={customInput}
              maxLength={MAX_MISSION_RUN_INPUT_LENGTH}
              onChange={(event) => setCustomInput(event.target.value)}
              disabled={busy}
              spellCheck={false}
              aria-describedby="mission-stdin-help"
              placeholder="프로그램에 전달할 입력을 작성하세요. 빈 입력도 실행할 수 있습니다."
            />
            <span id="mission-stdin-help" className="stdin-help">
              여러 줄·한글 입력 지원 · 최대 64KB · Ctrl/Cmd+Enter 실행 · Shift 추가 시 제출
              <b>
                {customInput.length.toLocaleString()} /{' '}
                {MAX_MISSION_RUN_INPUT_LENGTH.toLocaleString()}
              </b>
            </span>
          </div>
          <span className="console-line">
            <span className="cmd-prompt">표준 출력 (stdout)</span>
          </span>
          {error && <span className="console-line err">오류: {error}</span>}
          {busy && !result && (
            <span className="console-line info">… 안전한 실행 환경을 준비하고 있습니다.</span>
          )}
          {result && !isPending && (
            <>
              {result.kind === 'RUN' && (
                <div className="console-input-echo">
                  <strong>전달한 입력</strong>
                  <pre>{result.customInput || '(입력 없음)'}</pre>
                </div>
              )}
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
                    {test.passed ? '✓' : '✗'} CASE {String(test.order).padStart(2, '0')}
                    {test.isHidden ? ' (숨김)' : ''} — {test.passed ? '통과' : '실패'}
                  </span>
                ))}
              {result.errorKind !== 'NONE' ? (
                <>
                  {result.stderr && (
                    <span className="console-line stderr">stderr: {result.stderr}</span>
                  )}
                </>
              ) : result.stdout ? (
                <span className="console-line stdout">{result.stdout}</span>
              ) : !allPassed ? (
                <span className="console-line info">출력이 없습니다.</span>
              ) : null}
              {result.executionTimeMs !== null && (
                <span className="console-line info">
                  실행 시간: {result.executionTimeMs}ms · 종료 코드: {result.exitCode ?? '-'}
                </span>
              )}
              {allPassed && (
                <div className="success-banner">
                  <CheckCircle2 />
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

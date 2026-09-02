import { useEffect, useState, type ReactElement } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FileCode2,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { api, type AdminSubmissionLog, type AdminSubmissionLogDetail } from '../../lib/api.js';

const STATUSES = ['', 'PASSED', 'FAILED', 'ERROR', 'TIMED_OUT', 'RUNNING', 'QUEUED'] as const;

export function AdminSubmissionLogs(): ReactElement {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<{
    items: AdminSubmissionLog[];
    total: number;
    pages: number;
    summary: { passed: number; failed: number; pending: number };
  }>();
  const [selected, setSelected] = useState<AdminSubmissionLogDetail>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (): Promise<void> => {
    setLoading(true);
    try {
      setData(
        await api.adminSubmissionLogs({ page, status: status || undefined, query, from, to }),
      );
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '제출 로그를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => void load(), [page, status]);

  async function openDetail(id: string): Promise<void> {
    try {
      setSelected(await api.adminSubmissionLog(id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '상세 로그를 불러오지 못했습니다.');
    }
  }

  function downloadCsv(): void {
    if (!data?.items.length) return;
    const rows = [
      ['상태', '사용자', '문제', 'slug', '실행시간(ms)', '제출시각'],
      ...data.items.map((item) => [
        item.status,
        item.user.username,
        item.mission.title,
        item.mission.slug,
        String(item.executionTimeMs ?? ''),
        item.createdAt,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    link.download = `debugrove-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="page admin-log-page">
      <header className="admin-log-header">
        <div>
          <span className="admin-log-kicker">ADMIN / SUBMISSIONS</span>
          <h1>사용자 제출 로그</h1>
          <p>누가 어떤 문제를 제출했고 채점이 어떻게 끝났는지 확인합니다.</p>
        </div>
        <div className="admin-log-header-actions">
          <button className="btn" onClick={downloadCsv} disabled={!data?.items.length}>
            <Download size={15} /> CSV
          </button>
          <button className="btn" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={15} /> 새로고침
          </button>
        </div>
      </header>

      <div className="admin-log-summary">
        <div>
          <span>FILTERED TOTAL</span>
          <strong>{data?.total ?? 0}</strong>
        </div>
        <div className="passed">
          <span>PASSED</span>
          <strong>{data?.summary.passed ?? 0}</strong>
        </div>
        <div className="failed">
          <span>FAILED / ERROR</span>
          <strong>{data?.summary.failed ?? 0}</strong>
        </div>
        <div>
          <span>PROCESSING</span>
          <strong>{data?.summary.pending ?? 0}</strong>
        </div>
      </div>

      <form
        className="admin-log-filters"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load();
        }}
      >
        <label>
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="사용자, 문제명, slug, 제출 ID 검색"
          />
        </label>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          {STATUSES.map((value) => (
            <option key={value || 'ALL'} value={value}>
              {value || '전체 상태'}
            </option>
          ))}
        </select>
        <label className="admin-log-date">
          <span>FROM</span>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="admin-log-date">
          <span>TO</span>
          <input
            type="date"
            value={to}
            min={from}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <button className="btn" type="submit">
          검색
        </button>
      </form>

      {error && <p className="form-error">{error}</p>}
      <div className="admin-log-table-wrap">
        <table className="admin-log-table">
          <thead>
            <tr>
              <th>상태</th>
              <th>사용자</th>
              <th>문제</th>
              <th>실행 시간</th>
              <th>제출 시각</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {!loading && data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="admin-log-empty">
                  조건에 맞는 제출이 없습니다.
                </td>
              </tr>
            )}
            {data?.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Status status={item.status} />
                </td>
                <td>
                  <strong>{item.user.username}</strong>
                  <small>{item.user.id}</small>
                </td>
                <td>
                  <strong>{item.mission.title}</strong>
                  <small>{item.mission.slug}</small>
                </td>
                <td>{item.executionTimeMs == null ? '—' : `${item.executionTimeMs}ms`}</td>
                <td>{formatDate(item.createdAt)}</td>
                <td>
                  <button
                    className="admin-log-detail-button"
                    onClick={() => void openDetail(item.id)}
                  >
                    <FileCode2 size={14} /> 상세
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="admin-log-loading">제출 기록을 불러오는 중…</div>}
      </div>

      <footer className="admin-log-pagination">
        <span>
          총 {data?.total ?? 0}건 · {page}/{data?.pages ?? 1} 페이지
        </span>
        <div>
          <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            <ChevronLeft size={16} />
          </button>
          <button
            disabled={page >= (data?.pages ?? 1)}
            onClick={() => setPage((value) => value + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>

      {selected && (
        <SubmissionDetail submission={selected} onClose={() => setSelected(undefined)} />
      )}
    </div>
  );
}

function Status({ status }: { status: string }): ReactElement {
  return <span className={`admin-log-status ${status.toLowerCase()}`}>{status}</span>;
}

function SubmissionDetail({
  submission,
  onClose,
}: {
  submission: AdminSubmissionLogDetail;
  onClose: () => void;
}): ReactElement {
  const result = parseResult(submission.resultJson);
  return (
    <div
      className="admin-log-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="admin-log-drawer" role="dialog" aria-modal="true" aria-label="제출 상세">
        <header>
          <div>
            <Status status={submission.status} />
            <h2>{submission.mission.title}</h2>
            <p>
              {submission.user.username} · {formatDate(submission.createdAt)} ·{' '}
              {submission.executionTimeMs ?? '—'}ms
            </p>
          </div>
          <button onClick={onClose} aria-label="닫기">
            <X />
          </button>
        </header>
        <h3>제출 코드</h3>
        <pre>
          <code>{submission.code}</code>
        </pre>
        <h3>채점 결과</h3>
        {result ? (
          <div className="admin-result-report">
            <div className="admin-result-summary">
              <strong>
                {result.tests.filter((test) => test.passed).length}/{result.tests.length} TESTS
                PASSED
              </strong>
              <span>{result.errorKind === 'NONE' ? '실행 오류 없음' : result.errorKind}</span>
            </div>
            {result.diagnostic && (
              <div className="admin-result-diagnostic">
                <b>{result.diagnostic.kind}</b>
                <span>{result.diagnostic.message}</span>
                <small>
                  {result.diagnostic.line
                    ? `line ${result.diagnostic.line}${result.diagnostic.column ? `:${result.diagnostic.column}` : ''}`
                    : ''}
                </small>
              </div>
            )}
            <ol>
              {result.tests.map((test) => (
                <li className={test.passed ? 'passed' : 'failed'} key={test.order}>
                  <span>
                    {test.passed ? <Check /> : <X />} TEST {test.order}
                    {test.isHidden ? ' · HIDDEN' : ''}
                  </span>
                  <dl>
                    <div>
                      <dt>INPUT</dt>
                      <dd>{test.input ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>EXPECTED</dt>
                      <dd>{test.expectedOutput ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>ACTUAL</dt>
                      <dd>{test.actualOutput ?? '—'}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>
            {(result.stderr || result.stdout) && (
              <div className="admin-result-stream">
                <b>{result.stderr ? 'STDERR' : 'STDOUT'}</b>
                <pre>{result.stderr || result.stdout}</pre>
              </div>
            )}
          </div>
        ) : (
          <p className="admin-result-empty">저장된 채점 결과가 없습니다.</p>
        )}
        <p className="admin-log-id">SUBMISSION ID · {submission.id}</p>
      </section>
    </div>
  );
}

type ParsedResult = {
  errorKind: string;
  stdout: string;
  stderr: string;
  diagnostic: { kind: string; message: string; line: number | null; column: number | null } | null;
  tests: Array<{
    order: number;
    passed: boolean;
    isHidden: boolean;
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
  }>;
};

function parseResult(value: unknown): ParsedResult | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  const tests = Array.isArray(raw.tests)
    ? raw.tests
        .filter(
          (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object',
        )
        .map((item, index) => ({
          order: typeof item.order === 'number' ? item.order : index + 1,
          passed: item.passed === true,
          isHidden: item.isHidden === true,
          ...(typeof item.input === 'string' ? { input: item.input } : {}),
          ...(typeof item.expectedOutput === 'string'
            ? { expectedOutput: item.expectedOutput }
            : {}),
          ...(typeof item.actualOutput === 'string' ? { actualOutput: item.actualOutput } : {}),
        }))
    : [];
  const diagnostic =
    raw.diagnostic && typeof raw.diagnostic === 'object'
      ? (raw.diagnostic as Record<string, unknown>)
      : null;
  return {
    errorKind: typeof raw.errorKind === 'string' ? raw.errorKind : 'UNKNOWN',
    stdout: typeof raw.stdout === 'string' ? raw.stdout : '',
    stderr: typeof raw.stderr === 'string' ? raw.stderr : '',
    diagnostic: diagnostic
      ? {
          kind: String(diagnostic.kind ?? 'ERROR'),
          message: String(diagnostic.message ?? ''),
          line: typeof diagnostic.line === 'number' ? diagnostic.line : null,
          column: typeof diagnostic.column === 'number' ? diagnostic.column : null,
        }
      : null,
    tests,
  };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'medium' }).format(
    new Date(value),
  );
}

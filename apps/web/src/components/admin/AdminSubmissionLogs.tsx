import { useEffect, useState, type ReactElement } from 'react';
import { ChevronLeft, ChevronRight, FileCode2, RefreshCw, Search, X } from 'lucide-react';
import { api, type AdminSubmissionLog, type AdminSubmissionLogDetail } from '../../lib/api.js';

const STATUSES = ['', 'PASSED', 'FAILED', 'ERROR', 'TIMED_OUT', 'RUNNING', 'QUEUED'] as const;

export function AdminSubmissionLogs(): ReactElement {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: AdminSubmissionLog[]; total: number; pages: number }>();
  const [selected, setSelected] = useState<AdminSubmissionLogDetail>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (): Promise<void> => {
    setLoading(true);
    try {
      setData(await api.adminSubmissionLogs({ page, status: status || undefined, query }));
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

  return (
    <div className="page admin-log-page">
      <header className="admin-log-header">
        <div>
          <span className="admin-log-kicker">ADMIN / SUBMISSIONS</span>
          <h1>사용자 제출 로그</h1>
          <p>누가 어떤 문제를 제출했고 채점이 어떻게 끝났는지 확인합니다.</p>
        </div>
        <button className="btn" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={15} /> 새로고침
        </button>
      </header>

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
        <pre>
          <code>
            {submission.resultJson == null
              ? '결과 데이터 없음'
              : JSON.stringify(submission.resultJson, null, 2)}
          </code>
        </pre>
        <p className="admin-log-id">SUBMISSION ID · {submission.id}</p>
      </section>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'medium' }).format(
    new Date(value),
  );
}

import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Search, Trash2, Users } from 'lucide-react';
import { api, type AdminUser } from '../../lib/api.js';

export function AdminUsers(): ReactElement {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: AdminUser[]; total: number; pages: number }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(nextPage = page): Promise<void> {
    setLoading(true);
    try {
      setData(await api.adminUsers({ page: nextPage, query }));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '사용자 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => void load(), [page]);

  async function remove(user: AdminUser): Promise<void> {
    if (!window.confirm(`${user.username} 계정과 모든 학습 기록을 삭제할까요?`)) return;
    try {
      await api.deleteAdminUser(user.id);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '계정을 삭제하지 못했습니다.');
    }
  }

  function submit(event: FormEvent): void {
    event.preventDefault();
    if (page === 1) void load(1);
    else setPage(1);
  }

  return (
    <section className="page admin-users-page">
      <header className="admin-users-header">
        <div>
          <span>ADMIN / USERS</span>
          <h1>사용자 관리</h1>
          <p>가입 계정과 학습 활동을 확인하고 일반 사용자 계정을 관리합니다.</p>
        </div>
        <button className="btn" onClick={() => void load()} disabled={loading}>
          <RefreshCw /> 새로고침
        </button>
      </header>
      <div className="admin-users-summary">
        <Users />
        <div>
          <small>TOTAL USERS</small>
          <strong>{data?.total ?? 0}</strong>
        </div>
      </div>
      <form className="admin-users-search" onSubmit={submit}>
        <Search />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="닉네임 또는 이메일 검색"
          aria-label="사용자 검색"
        />
        <button className="btn" type="submit">
          검색
        </button>
      </form>
      {error && <p className="form-error">{error}</p>}
      <div className="admin-users-list">
        {data?.items.map((user) => (
          <article key={user.id}>
            <div className="admin-user-avatar">{user.username.charAt(0).toUpperCase()}</div>
            <div className="admin-user-identity">
              <strong>{user.username}</strong>
              <span>{user.email}</span>
              <small>
                {user.provider} · {new Date(user.createdAt).toLocaleDateString('ko-KR')}
              </small>
            </div>
            <div className="admin-user-metrics">
              <span>
                <b>{user.totalXp.toLocaleString()}</b> XP
              </span>
              <span>
                <b>{user._count.progress}</b> 진행
              </span>
              <span>
                <b>{user._count.submissions}</b> 제출
              </span>
              <span>
                <b>{user._count.followers}</b> 팔로워
              </span>
            </div>
            <span className={`admin-user-role role-${user.role.toLowerCase()}`}>{user.role}</span>
            <button
              className="admin-user-delete"
              disabled={user.role === 'ADMIN'}
              onClick={() => void remove(user)}
              aria-label={`${user.username} 계정 삭제`}
              title={user.role === 'ADMIN' ? '관리자 계정은 삭제할 수 없습니다.' : '계정 삭제'}
            >
              <Trash2 />
            </button>
          </article>
        ))}
        {!loading && data?.items.length === 0 && (
          <div className="admin-users-empty">조건에 맞는 사용자가 없습니다.</div>
        )}
        {loading && <div className="admin-users-empty">사용자 목록을 불러오는 중…</div>}
      </div>
      <footer className="admin-users-pagination">
        <span>
          {page}/{data?.pages ?? 1} 페이지
        </span>
        <div>
          <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            <ChevronLeft />
          </button>
          <button
            disabled={page >= (data?.pages ?? 1)}
            onClick={() => setPage((value) => value + 1)}
          >
            <ChevronRight />
          </button>
        </div>
      </footer>
    </section>
  );
}

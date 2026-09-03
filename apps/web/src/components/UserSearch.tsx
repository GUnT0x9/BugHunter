import { useState, type FormEvent, type ReactElement } from 'react';
import type { CommunityUser } from '@bughunter/contracts';
import { Search, UserMinus, UserPlus, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export function UserSearch(): ReactElement {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CommunityUser[]>([]);
  const [searched, setSearched] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  async function search(event?: FormEvent): Promise<void> {
    event?.preventDefault();
    const value = query.trim();
    if (value.length < 2) {
      setError('닉네임을 2자 이상 입력해주세요.');
      return;
    }
    setError('');
    setSearched(true);
    try {
      setResults(await api.searchUsers(value));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '사용자를 검색하지 못했습니다.');
    }
  }

  async function toggleFollow(user: CommunityUser): Promise<void> {
    setBusyId(user.id);
    setError('');
    try {
      await (user.isFollowing ? api.unfollow(user.id) : api.follow(user.id));
      setResults(await api.searchUsers(query.trim()));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '팔로우 상태를 변경하지 못했습니다.');
    } finally {
      setBusyId('');
    }
  }

  return (
    <section className="page user-search-page">
      <header>
        <span className="page-kicker">USER LOOKUP</span>
        <h1>디버거 검색</h1>
        <p>닉네임으로 사용자를 찾고 프로필과 학습 기록을 확인하세요.</p>
      </header>
      <form className="user-search-console" onSubmit={(event) => void search(event)}>
        <Search />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="사용자 이름 입력"
          maxLength={32}
          aria-label="사용자 이름"
        />
          <button className="btn primary" type="submit">
            검색
          </button>
      </form>
      {error && (
        <p className="form-error" aria-live="polite">
          {error}
        </p>
      )}
      <div className="user-search-results">
        {results.map((user) => (
          <article key={user.id}>
            <Link className="community-avatar" to={`/community/users/${user.id}`}>
              {user.username.charAt(0).toUpperCase()}
            </Link>
            <Link className="user-search-copy" to={`/community/users/${user.id}`}>
              <strong>{user.username}</strong>
              <small>
                LV.{user.level} · {user.totalXp.toLocaleString()} XP · 미션 {user.solvedCount}개
              </small>
            </Link>
            {!user.isSelf && (
              <button
                className={user.isFollowing ? 'btn ghost' : 'btn primary'}
                disabled={busyId === user.id}
                onClick={() => void toggleFollow(user)}
              >
                {user.isFollowing ? <UserMinus /> : <UserPlus />}
                {user.isFollowing ? '팔로우 중' : '팔로우'}
              </button>
            )}
          </article>
        ))}
        {searched && results.length === 0 && (
          <div className="user-search-empty" role="status">
            <UserX />
            <strong>검색 결과 없음</strong>
            <span>“{query.trim()}” 이름의 디버거를 찾지 못했습니다.</span>
            <small>철자를 확인하거나 다른 닉네임으로 검색해보세요.</small>
          </div>
        )}
        {!searched && (
          <div className="user-search-idle">
            <Search />
            <span>검색어를 입력하면 디버거 목록이 표시됩니다.</span>
          </div>
        )}
      </div>
    </section>
  );
}

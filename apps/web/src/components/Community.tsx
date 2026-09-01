import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import type { CommunityUser, FriendOverview, RankingResponse } from '@bughunter/contracts';
import { Check, Clock3, Search, Trophy, UserMinus, UserPlus, Users, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { Empty } from './ui/Empty.js';

const emptyFriends: FriendOverview = { friends: [], incoming: [], outgoing: [] };
const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : '요청을 처리하지 못했습니다.';

export function Community(): ReactElement {
  const [ranking, setRanking] = useState<RankingResponse | null>(null);
  const [friends, setFriends] = useState<FriendOverview>(emptyFriends);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CommunityUser[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  async function loadOverview(): Promise<void> {
    const [nextRanking, nextFriends] = await Promise.all([api.rankings(), api.friends()]);
    setRanking(nextRanking);
    setFriends(nextFriends);
  }

  useEffect(() => {
    void loadOverview()
      .catch((loadError: unknown) => setError(messageOf(loadError)))
      .finally(() => setLoading(false));
  }, []);

  async function search(event?: FormEvent): Promise<void> {
    event?.preventDefault();
    const normalized = query.trim();
    if (normalized.length < 2) {
      setError('닉네임을 2자 이상 입력해주세요.');
      return;
    }
    setError('');
    setSearched(true);
    try {
      setResults(await api.searchUsers(normalized));
    } catch (searchError: unknown) {
      setError(messageOf(searchError));
    }
  }

  async function act(id: string, action: () => Promise<unknown>): Promise<void> {
    setBusyId(id);
    setError('');
    try {
      await action();
      await loadOverview();
      if (searched && query.trim().length >= 2) setResults(await api.searchUsers(query.trim()));
    } catch (actionError: unknown) {
      setError(messageOf(actionError));
    } finally {
      setBusyId('');
    }
  }

  return (
    <section className="page community-page">
      <header className="community-header">
        <div>
          <span className="page-kicker">COMMUNITY</span>
          <h1 className="page-title">함께 성장하기</h1>
          <p>다른 디버거의 기록을 확인하고 친구와 학습 페이스를 맞춰보세요.</p>
        </div>
        {ranking?.me && (
          <div className="my-rank-card">
            <span>내 랭킹</span><strong>#{ranking.me.rank}</strong>
            <small>LV.{ranking.me.level} · {ranking.me.totalXp.toLocaleString()} XP</small>
          </div>
        )}
      </header>
      {error && <p className="form-error community-error" aria-live="polite">{error}</p>}

      <div className="community-grid">
        <section className="community-panel ranking-panel" aria-labelledby="ranking-title">
          <div className="community-panel-title">
            <h2 id="ranking-title"><Trophy aria-hidden="true" /> XP 랭킹</h2><span>TOP 50</span>
          </div>
          <ol className="ranking-list">
            {ranking?.entries.map((entry) => (
              <li key={entry.id} className={entry.relationship === 'SELF' ? 'is-me' : ''}>
                <b className={`rank-number rank-${entry.rank}`}>#{entry.rank}</b>
                <span className="community-avatar" aria-hidden="true">{entry.username.charAt(0).toUpperCase()}</span>
                <span className="community-user-copy">
                  <strong>{entry.username}{entry.relationship === 'SELF' && <em>나</em>}</strong>
                  <small>LV.{entry.level} · 미션 {entry.solvedCount}개 해결</small>
                </span>
                <b className="rank-xp">{entry.totalXp.toLocaleString()} XP</b>
              </li>
            ))}
          </ol>
          {!loading && !ranking?.entries.length && <Empty text="아직 랭킹 데이터가 없습니다." />}
        </section>

        <div className="community-side">
          <section className="community-panel" aria-labelledby="search-title">
            <div className="community-panel-title"><h2 id="search-title"><Search aria-hidden="true" /> 유저 검색</h2></div>
            <form className="community-search" onSubmit={(event) => void search(event)}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="닉네임으로 검색" aria-label="유저 닉네임 검색" maxLength={32} />
              <button className="btn primary" type="submit">검색</button>
            </form>
            <div className="community-user-list search-results">
              {results.map((user) => <UserRow key={user.id} user={user} busy={busyId === user.id} onAct={act} />)}
              {searched && !results.length && <Empty text="일치하는 유저가 없습니다." />}
            </div>
          </section>

          <section className="community-panel" aria-labelledby="requests-title">
            <div className="community-panel-title"><h2 id="requests-title"><Clock3 aria-hidden="true" /> 친구 요청</h2><span>{friends.incoming.length} RECEIVED</span></div>
            <div className="community-user-list">
              {friends.incoming.map((user) => <UserRow key={user.id} user={user} busy={busyId === user.id} onAct={act} />)}
              {friends.outgoing.map((user) => <UserRow key={user.id} user={user} busy={busyId === user.id} onAct={act} />)}
              {!friends.incoming.length && !friends.outgoing.length && <Empty text="대기 중인 친구 요청이 없습니다." />}
            </div>
          </section>

          <section className="community-panel" aria-labelledby="friends-title">
            <div className="community-panel-title"><h2 id="friends-title"><Users aria-hidden="true" /> 내 친구</h2><span>{friends.friends.length} FRIENDS</span></div>
            <div className="community-user-list">
              {friends.friends.map((user) => <UserRow key={user.id} user={user} busy={busyId === user.id} onAct={act} />)}
              {!friends.friends.length && <Empty text="유저를 검색해 첫 친구를 추가해보세요." />}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function UserRow({ user, busy, onAct }: { user: CommunityUser; busy: boolean; onAct: (id: string, action: () => Promise<unknown>) => Promise<void> }): ReactElement {
  const friendshipId = user.friendshipId;
  return (
    <article className="community-user-row">
      <span className="community-avatar" aria-hidden="true">{user.username.charAt(0).toUpperCase()}</span>
      <span className="community-user-copy"><strong>{user.username}</strong><small>LV.{user.level} · {user.totalXp.toLocaleString()} XP · 미션 {user.solvedCount}개</small></span>
      <span className="community-user-actions">
        {user.relationship === 'NONE' && <button className="btn primary" disabled={busy} onClick={() => void onAct(user.id, () => api.requestFriend(user.id))}><UserPlus aria-hidden="true" /> 친구 추가</button>}
        {user.relationship === 'PENDING_INCOMING' && friendshipId && <><button className="btn primary" disabled={busy} onClick={() => void onAct(user.id, () => api.acceptFriend(friendshipId))}><Check aria-hidden="true" /> 수락</button><button className="btn ghost" disabled={busy} onClick={() => void onAct(user.id, () => api.removeFriendship(friendshipId))}><X aria-hidden="true" /> 거절</button></>}
        {user.relationship === 'PENDING_OUTGOING' && friendshipId && <button className="btn ghost" disabled={busy} onClick={() => void onAct(user.id, () => api.removeFriendship(friendshipId))}><Clock3 aria-hidden="true" /> 요청 취소</button>}
        {user.relationship === 'FRIEND' && friendshipId && <button className="btn ghost" disabled={busy} onClick={() => void onAct(user.id, () => api.removeFriendship(friendshipId))}><UserMinus aria-hidden="true" /> 친구 삭제</button>}
      </span>
    </article>
  );
}

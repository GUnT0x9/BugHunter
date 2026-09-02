import { useEffect, useState, type FormEvent, type ReactElement } from 'react';
import type { CommunityUser, FollowOverview, RankingResponse } from '@bughunter/contracts';
import { CalendarDays, Search, Star, Trophy, UserMinus, UserPlus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Empty } from './ui/Empty.js';

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : '요청을 처리하지 못했습니다.';

export function Community(): ReactElement {
  const [ranking, setRanking] = useState<RankingResponse | null>(null);
  const [network, setNetwork] = useState<FollowOverview>({ followers: [], following: [] });
  const [weekly, setWeekly] = useState<Awaited<ReturnType<typeof api.weeklyComparison>> | null>(
    null,
  );
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CommunityUser[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  async function loadOverview(): Promise<void> {
    const [nextRanking, nextWeekly] = await Promise.all([api.rankings(), api.weeklyComparison()]);
    const nextNetwork = await api.follows(nextRanking.me.id);
    setRanking(nextRanking);
    setNetwork(nextNetwork);
    setWeekly(nextWeekly);
  }
  useEffect(() => {
    void loadOverview()
      .catch((reason: unknown) => setError(messageOf(reason)))
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
    } catch (reason: unknown) {
      setError(messageOf(reason));
    }
  }

  async function toggleFollow(user: CommunityUser): Promise<void> {
    setBusyId(user.id);
    setError('');
    try {
      await (user.isFollowing ? api.unfollow(user.id) : api.follow(user.id));
      await loadOverview();
      if (searched) setResults(await api.searchUsers(query.trim()));
    } catch (reason: unknown) {
      setError(messageOf(reason));
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
          <p>관심 있는 디버거를 팔로우하고 서로의 성장 기록을 확인하세요.</p>
        </div>
        {ranking?.me && (
          <div className="my-rank-card">
            <span>내 랭킹</span>
            <strong>#{ranking.me.rank}</strong>
            <small>
              LV.{ranking.me.level} · {ranking.me.totalXp.toLocaleString()} XP
            </small>
          </div>
        )}
      </header>
      {error && (
        <p className="form-error community-error" aria-live="polite">
          {error}
        </p>
      )}
      {weekly && <WeeklyPodium data={weekly} />}
      <div className="community-grid">
        <section className="community-panel ranking-panel" aria-labelledby="ranking-title">
          <div className="community-panel-title">
            <h2 id="ranking-title">
              <Trophy /> XP 랭킹
            </h2>
            <span>TOP 50</span>
          </div>
          <ol className="ranking-list">
            {ranking?.entries.map((entry) => (
              <li key={entry.id} className={entry.isSelf ? 'is-me' : ''}>
                <b className={`rank-number rank-${entry.rank}`}>#{entry.rank}</b>
                <Link className="community-avatar" to={`/community/users/${entry.id}`}>
                  {entry.username.charAt(0).toUpperCase()}
                </Link>
                <Link className="community-user-copy" to={`/community/users/${entry.id}`}>
                  <strong>
                    {entry.username}
                    {entry.isSelf && <em>나</em>}
                  </strong>
                  <small>
                    LV.{entry.level} · 미션 {entry.solvedCount}개 해결
                  </small>
                </Link>
                <b className="rank-xp">{entry.totalXp.toLocaleString()} XP</b>
              </li>
            ))}
          </ol>
          {!loading && !ranking?.entries.length && <Empty text="아직 랭킹 데이터가 없습니다." />}
        </section>
        <div className="community-side">
          <section className="community-panel">
            <div className="community-panel-title">
              <h2>
                <Search /> 유저 검색
              </h2>
            </div>
            <form className="community-search" onSubmit={(event) => void search(event)}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="닉네임으로 검색"
                aria-label="유저 닉네임 검색"
                maxLength={32}
              />
              <button className="btn primary" type="submit">
                검색
              </button>
            </form>
            <div className="community-user-list search-results">
              {results.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  busy={busyId === user.id}
                  onToggle={toggleFollow}
                />
              ))}
              {searched && !results.length && <Empty text="일치하는 유저가 없습니다." />}
            </div>
          </section>
          <NetworkPanel
            title="팔로워"
            users={network.followers}
            busyId={busyId}
            onToggle={toggleFollow}
          />
          <NetworkPanel
            title="팔로잉"
            users={network.following}
            busyId={busyId}
            onToggle={toggleFollow}
          />
        </div>
      </div>
    </section>
  );
}

function WeeklyPodium({
  data,
}: {
  data: Awaited<ReturnType<typeof api.weeklyComparison>>;
}): ReactElement {
  const podium = [data.entries[1], data.entries[0], data.entries[2]].filter(
    (entry): entry is (typeof data.entries)[number] => Boolean(entry),
  );
  const rest = data.entries.slice(3);
  const period = `${new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(
    new Date(data.startsAt),
  )} – ${new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(
    new Date(new Date(data.endsAt).getTime() - 1),
  )}`;
  return (
    <section className="weekly-podium-panel" aria-labelledby="weekly-podium-title">
      <header>
        <div>
          <span className="page-kicker">FOLLOWING WEEKLY</span>
          <h2 id="weekly-podium-title">이번 주 디버거</h2>
        </div>
        <small>
          <CalendarDays /> {period} · 해결 문제 기준
        </small>
      </header>
      <div className="weekly-podium">
        {podium.map((entry) => (
          <Link
            className={`podium-place place-${entry.rank} ${entry.isSelf ? 'is-me' : ''}`}
            to={`/community/users/${entry.id}`}
            key={entry.id}
          >
            <span className="podium-rank">#{entry.rank}</span>
            <span className="podium-avatar">{entry.username.charAt(0).toUpperCase()}</span>
            <strong>
              {entry.username} {entry.isSelf && <em>나</em>}
            </strong>
            <b>
              {entry.solvedCount}
              <small>문제</small>
            </b>
            <span className="podium-stars">
              <Star /> {entry.earnedStars} 별
            </span>
            <i aria-hidden="true" />
          </Link>
        ))}
      </div>
      {rest.length > 0 && (
        <ol className="weekly-rest">
          {rest.map((entry) => (
            <li className={entry.isSelf ? 'is-me' : ''} key={entry.id}>
              <b>#{entry.rank}</b>
              <Link to={`/community/users/${entry.id}`}>{entry.username}</Link>
              <span>{entry.solvedCount}문제</span>
              <small>
                <Star /> {entry.earnedStars}
              </small>
            </li>
          ))}
        </ol>
      )}
      {data.entries.length === 1 && (
        <p className="weekly-podium-empty">
          팔로잉을 추가하면 이번 주 기록을 함께 비교할 수 있습니다.
        </p>
      )}
    </section>
  );
}

function NetworkPanel({
  title,
  users,
  busyId,
  onToggle,
}: {
  title: string;
  users: CommunityUser[];
  busyId: string;
  onToggle: (user: CommunityUser) => Promise<void>;
}): ReactElement {
  return (
    <section className="community-panel">
      <div className="community-panel-title">
        <h2>
          <Users /> {title}
        </h2>
        <span>{users.length}</span>
      </div>
      <div className="community-user-list">
        {users.map((user) => (
          <UserRow key={user.id} user={user} busy={busyId === user.id} onToggle={onToggle} />
        ))}
        {!users.length && <Empty text={`아직 ${title} 사용자가 없습니다.`} />}
      </div>
    </section>
  );
}

function UserRow({
  user,
  busy,
  onToggle,
}: {
  user: CommunityUser;
  busy: boolean;
  onToggle: (user: CommunityUser) => Promise<void>;
}): ReactElement {
  return (
    <article className="community-user-row">
      <Link className="community-avatar" to={`/community/users/${user.id}`}>
        {user.username.charAt(0).toUpperCase()}
      </Link>
      <Link className="community-user-copy" to={`/community/users/${user.id}`}>
        <strong>{user.username}</strong>
        <small>
          LV.{user.level} · {user.totalXp.toLocaleString()} XP · 미션 {user.solvedCount}개
        </small>
      </Link>
      {!user.isSelf && (
        <span className="community-user-actions">
          <button
            className={user.isFollowing ? 'btn ghost' : 'btn primary'}
            disabled={busy}
            onClick={() => void onToggle(user)}
          >
            {user.isFollowing ? <UserMinus /> : <UserPlus />}
            {user.isFollowing ? '팔로잉' : '팔로우'}
          </button>
        </span>
      )}
    </article>
  );
}

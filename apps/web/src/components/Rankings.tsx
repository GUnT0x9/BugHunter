import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { CalendarDays, Clock3, Star, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RankingResponse } from '@bughunter/contracts';
import { api } from '../lib/api.js';
import { Empty } from './ui/Empty.js';

type RankingTab = 'season' | 'weekly' | 'alltime';

const periodLabel = (start: string, end: string) => {
  const formatter = new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' });
  return `${formatter.format(new Date(start))} – ${formatter.format(new Date(new Date(end).getTime() - 1))}`;
};

const durationLabel = (seconds: number) => {
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))}초`;
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분` : `${minutes}분`;
};

type PodiumEntry = {
  id: string;
  username: string;
  isSelf: boolean;
  rank: number;
  headline: ReactNode;
  subline: ReactNode;
};

function PodiumTop({ entries }: { entries: PodiumEntry[] }): ReactElement {
  const ordered = [entries[1], entries[0], entries[2]].filter(
    (entry): entry is PodiumEntry => Boolean(entry),
  );
  return (
    <div className="weekly-podium">
      {ordered.map((entry) => (
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
          <b>{entry.headline}</b>
          <span className="podium-stars">{entry.subline}</span>
          <i />
        </Link>
      ))}
    </div>
  );
}

export function Rankings(): ReactElement {
  const [tab, setTab] = useState<RankingTab>('season');
  const [season, setSeason] = useState<Awaited<ReturnType<typeof api.seasonRankings>> | null>(null);
  const [weekly, setWeekly] = useState<Awaited<ReturnType<typeof api.weeklyComparison>> | null>(
    null,
  );
  const [alltime, setAlltime] = useState<RankingResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void Promise.all([api.seasonRankings(), api.weeklyComparison(), api.rankings()])
      .then(([nextSeason, nextWeekly, nextAlltime]) => {
        setSeason(nextSeason);
        setWeekly(nextWeekly);
        setAlltime(nextAlltime);
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : '랭킹을 불러오지 못했습니다.'),
      );
  }, []);

  return (
    <section className="page rankings-page">
      <header className="rankings-hero">
        <div>
          <span className="page-kicker">DEBUGGER RANKINGS</span>
          <h1>랭킹</h1>
          <p>시즌과 팔로잉 그룹에서 나의 디버깅 기록을 비교합니다.</p>
        </div>
        {season?.me && (
          <div className="season-my-rank">
            <span>SEASON {season.season.number}</span>
            <strong>{season.me.rank > 0 ? `#${season.me.rank}` : '—'}</strong>
            <small>
              {season.me.earnedStars} 별 · {season.me.solvedCount}문제
            </small>
          </div>
        )}
      </header>
      <nav className="ranking-tabs" aria-label="랭킹 종류">
        <button className={tab === 'season' ? 'active' : ''} onClick={() => setTab('season')}>
          시즌 랭킹
        </button>
        <button className={tab === 'weekly' ? 'active' : ''} onClick={() => setTab('weekly')}>
          팔로잉 주간
        </button>
        <button className={tab === 'alltime' ? 'active' : ''} onClick={() => setTab('alltime')}>
          누적 XP
        </button>
      </nav>
      {error && <Empty tone="error" text={error} />}
      {!error && (!season || !weekly || !alltime) ? (
        <Empty text="랭킹을 계산하는 중입니다." />
      ) : null}
      {tab === 'season' && season && <SeasonTable data={season} />}
      {tab === 'weekly' && weekly && <WeeklyPodium data={weekly} />}
      {tab === 'alltime' && alltime && <AllTimeTable data={alltime} />}
    </section>
  );
}

function SeasonTable({
  data,
}: {
  data: Awaited<ReturnType<typeof api.seasonRankings>>;
}): ReactElement {
  return (
    <section className="season-board">
      <header>
        <div>
          <span>SEASON {data.season.number}</span>
          <h2>4주 시즌 랭킹</h2>
        </div>
        <small>
          <CalendarDays /> {periodLabel(data.season.startsAt, data.season.endsAt)}
        </small>
      </header>
      <div className="season-rule">별 → 해결 문제 → 평균 해결 시간 → 3성 → 제출 시도 순</div>
      {data.entries.length > 0 && (
        <PodiumTop
          entries={data.entries.slice(0, 3).map((entry) => ({
            id: entry.id,
            username: entry.username,
            isSelf: entry.isSelf,
            rank: entry.rank,
            headline: (
              <>
                {entry.earnedStars}
                <small>별</small>
              </>
            ),
            subline: (
              <>
                {entry.solvedCount}문제 · 평균 {durationLabel(entry.averageSolveTimeSeconds)}
              </>
            ),
          }))}
        />
      )}
      <ol>
        {data.entries.slice(3).map((entry) => (
          <li className={entry.isSelf ? 'is-me' : ''} key={entry.id}>
            <b className={`rank-number rank-${entry.rank}`}>#{entry.rank}</b>
            <Link className="community-avatar" to={`/community/users/${entry.id}`}>
              {entry.username.charAt(0).toUpperCase()}
            </Link>
            <Link className="season-user" to={`/community/users/${entry.id}`}>
              <strong>
                {entry.username}
                {entry.isSelf && <em>나</em>}
              </strong>
              <small>
                <Clock3 /> 평균 {durationLabel(entry.averageSolveTimeSeconds)} ·{' '}
                {entry.totalAttempts}회 제출
              </small>
            </Link>
            <span className="season-perfect">3성 {entry.perfectCount}</span>
            <span className="season-solved">
              {entry.solvedCount}
              <small>문제</small>
            </span>
            <strong className="season-stars">
              <Star /> {entry.earnedStars}
            </strong>
          </li>
        ))}
      </ol>
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
  return (
    <section className="weekly-podium-panel">
      <header>
        <div>
          <span className="page-kicker">FOLLOWING WEEKLY</span>
          <h2>이번 주 디버거</h2>
        </div>
        <small>
          <CalendarDays /> {periodLabel(data.startsAt, data.endsAt)} · 해결 문제 기준
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
            <i />
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
      {data.entries.length === 0 && (
        <p className="weekly-podium-empty">이번 주 기록이 아직 없습니다.</p>
      )}
      {data.entries.length === 1 && (
        <p className="weekly-podium-empty">
          커뮤니티에서 팔로잉을 추가하면 기록을 비교할 수 있습니다.
        </p>
      )}
    </section>
  );
}

function AllTimeTable({ data }: { data: RankingResponse }): ReactElement {
  return (
    <section className="community-panel ranking-panel">
      <div className="community-panel-title">
        <h2>
          <Trophy /> 누적 XP 랭킹
        </h2>
        <span>TOP 50</span>
      </div>
      {data.entries.length > 0 && (
        <div className="alltime-podium-wrap">
          <PodiumTop
            entries={data.entries.slice(0, 3).map((entry) => ({
              id: entry.id,
              username: entry.username,
              isSelf: entry.isSelf,
              rank: entry.rank,
              headline: (
                <>
                  {entry.totalXp.toLocaleString()}
                  <small>XP</small>
                </>
              ),
              subline: (
                <>
                  LV.{entry.level} · 미션 {entry.solvedCount}개
                </>
              ),
            }))}
          />
        </div>
      )}
      <ol className="ranking-list">
        {data.entries.slice(3).map((entry) => (
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
    </section>
  );
}

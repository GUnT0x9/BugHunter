import { useEffect, useState, type ReactElement } from 'react';
import { ArrowLeft, CalendarDays, Medal, Terminal, UserMinus, UserPlus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { FollowOverview, PublicProfile as PublicProfileData } from '@bughunter/contracts';
import { api } from '../lib/api.js';
import { Empty } from './ui/Empty.js';
import { ActivityHeatmap } from './ui/ActivityHeatmap.js';

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : '요청을 처리하지 못했습니다.';
const dateLabel = (value: string): string =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }).format(
    new Date(value),
  );

export function PublicProfile(): ReactElement {
  const { id = '' } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [follows, setFollows] = useState<FollowOverview | null>(null);
  const [tab, setTab] = useState<'activity' | 'followers' | 'following'>('activity');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load(): Promise<void> {
    const [nextProfile, nextFollows] = await Promise.all([api.publicProfile(id), api.follows(id)]);
    setProfile(nextProfile);
    setFollows(nextFollows);
  }

  useEffect(() => {
    setError('');
    setTab('activity');
    void load().catch((reason: unknown) => setError(messageOf(reason)));
  }, [id]);

  async function act(action: () => Promise<unknown>): Promise<void> {
    setBusy(true);
    setError('');
    try {
      await action();
      await load();
    } catch (reason: unknown) {
      setError(messageOf(reason));
    } finally {
      setBusy(false);
    }
  }

  if (!profile)
    return (
      <section className="page">
        <Link className="btn ghost" to="/search">
          <ArrowLeft /> 커뮤니티로
        </Link>
        <p className={error ? 'form-error' : 'muted'}>{error || '프로필을 불러오는 중입니다…'}</p>
      </section>
    );

  const activeDays = profile.activityDays.filter((day) => day.count > 0).length;
  const listedUsers = tab === 'followers' ? follows?.followers : follows?.following;

  return (
    <section className="page profile-page">
      <Link className="btn ghost public-profile-back" to="/search">
        <ArrowLeft /> 커뮤니티로
      </Link>
      {error && <p className="form-error">{error}</p>}
      <header className="profile-identity">
        <div className="profile-avatar" aria-hidden="true">
          {profile.username.charAt(0).toUpperCase()}
        </div>
        <div className="profile-heading">
          <div className="profile-name-row">
            <h1>{profile.username}</h1>
          </div>
          <p>
            LV.{profile.level} · 디버거
          </p>
          <p className="profile-bio">{profile.bio || '아직 자기소개가 없습니다.'}</p>
          <span className="profile-joined">
            <CalendarDays aria-hidden="true" />
            {dateLabel(profile.joinedAt)} 가입
          </span>
        </div>
        {!profile.isSelf && (
          <button
            className={profile.isFollowing ? 'btn' : 'btn primary'}
            disabled={busy}
            onClick={() =>
              void act(() =>
                profile.isFollowing ? api.unfollow(profile.id) : api.follow(profile.id),
              )
            }
          >
            {profile.isFollowing ? <UserMinus /> : <UserPlus />}{' '}
            {profile.isFollowing ? '팔로우 중' : '팔로우'}
          </button>
        )}
      </header>

      <dl className="profile-stat-strip">
        <div>
          <dt>해결한 문제</dt>
          <dd>{profile.solvedCount}</dd>
        </div>
        <div>
          <dt>획득 XP</dt>
          <dd>{profile.totalXp.toLocaleString()}</dd>
        </div>
        <div>
          <dt>팔로워</dt>
          <dd>
            <button
              className="stat-count-btn"
              onClick={() => setTab(tab === 'followers' ? 'activity' : 'followers')}
            >
              {profile.followerCount}
            </button>
          </dd>
        </div>
        <div>
          <dt>팔로잉</dt>
          <dd>
            <button
              className="stat-count-btn"
              onClick={() => setTab(tab === 'following' ? 'activity' : 'following')}
            >
              {profile.followingCount}
            </button>
          </dd>
        </div>
      </dl>

      <div className="profile-content">
        <section className="profile-section" aria-labelledby="activity-heading">
          <div className="profile-section-title">
            <h2 id="activity-heading">학습 기록</h2>
            <span>
              최근 12주 · 총 {activeDays}일
            </span>
          </div>
          <ActivityHeatmap days={profile.activityDays} />
        </section>

        <section className="profile-section" aria-labelledby="recent-heading">
          <div className="profile-section-title">
            <h2 id="recent-heading">최근 활동</h2>
          </div>
          <ol className="profile-activity-list">
            {profile.recentActivity.length ? (
              profile.recentActivity.map((activity) => (
                <li key={`${activity.id}-${activity.occurredAt}`}>
                  <Terminal aria-hidden="true" />
                  <div>
                    <strong>{activity.title}</strong>
                    <span>
                      {activity.detail} · {dateLabel(activity.occurredAt)}
                    </span>
                  </div>
                  <b>+{activity.xp} XP</b>
                </li>
              ))
            ) : (
              <li className="profile-empty">아직 공개할 활동이 없습니다.</li>
            )}
          </ol>
        </section>
      </div>

      {profile.featuredAchievements.length > 0 && (
        <section className="featured-achievements" aria-labelledby="featured-achievements-title">
          <header>
            <h2 id="featured-achievements-title">대표 업적</h2>
            <span>자동 선정</span>
          </header>
          <div>
            {profile.featuredAchievements.map((achievement) => (
              <article
                className={`rarity-${achievement.rarity.toLowerCase()}`}
                key={achievement.code}
              >
                <Medal />
                <div>
                  <span>
                    {achievement.rarity} · {achievement.group}
                  </span>
                  <strong>{achievement.title}</strong>
                  <small>{achievement.description}</small>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab !== 'activity' && (
        <section className="community-panel public-profile-content">
          <div className="guide-tabs public-profile-tabs">
            <button
              className={tab === 'followers' ? 'active' : ''}
              onClick={() => setTab('followers')}
            >
              팔로워
            </button>
            <button
              className={tab === 'following' ? 'active' : ''}
              onClick={() => setTab('following')}
            >
              팔로잉
            </button>
          </div>
          <div className="community-user-list">
            {listedUsers?.map((user) => (
              <Link className="community-user-row" to={`/community/users/${user.id}`} key={user.id}>
                <span className="community-avatar">{user.username.charAt(0).toUpperCase()}</span>
                <span className="community-user-copy">
                  <strong>{user.username}</strong>
                  <small>
                    LV.{user.level} · {user.totalXp.toLocaleString()} XP
                  </small>
                </span>
                {user.followsMe && <span className="tag">나를 팔로우</span>}
              </Link>
            ))}
            {!listedUsers?.length && (
              <Empty text={`${tab === 'followers' ? '팔로워' : '팔로잉'}가 없습니다.`} />
            )}
          </div>
        </section>
      )}
    </section>
  );
}

import { useEffect, useState, type ReactElement } from 'react';
import { ArrowLeft, CalendarDays, Check, Terminal, UserMinus, UserPlus, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { FollowOverview, PublicProfile as PublicProfileData } from '@bughunter/contracts';
import { api } from '../lib/api.js';
import { Empty } from './ui/Empty.js';

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
        <Link className="btn ghost" to="/community">
          <ArrowLeft /> 커뮤니티
        </Link>
        <p className={error ? 'form-error' : 'muted'}>{error || '프로필을 불러오는 중입니다…'}</p>
      </section>
    );
  const listedUsers = tab === 'followers' ? follows?.followers : follows?.following;
  return (
    <section className="page public-profile-page">
      <Link className="btn ghost public-profile-back" to="/community">
        <ArrowLeft /> 커뮤니티로
      </Link>
      {error && <p className="form-error">{error}</p>}
      <header className="public-profile-hero">
        <div className="profile-avatar" aria-hidden="true">
          {profile.username.charAt(0).toUpperCase()}
        </div>
        <div className="public-profile-copy">
          <span className="page-kicker">DEBUGGER PROFILE</span>
          <h1>{profile.username}</h1>
          <p>{profile.bio || '아직 자기소개가 없습니다.'}</p>
          <span>
            <CalendarDays /> {dateLabel(profile.joinedAt)} 가입
          </span>
        </div>
        {profile.relationship !== 'SELF' && (
          <div className="public-profile-actions">
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
              {profile.isFollowing ? '팔로잉' : '팔로우'}
            </button>
            {profile.relationship === 'NONE' && (
              <button
                className="btn"
                disabled={busy}
                onClick={() => void act(() => api.requestFriend(profile.id))}
              >
                <Users /> 친구 요청
              </button>
            )}
            {profile.relationship === 'PENDING_INCOMING' && profile.friendshipId && (
              <button
                className="btn primary"
                disabled={busy}
                onClick={() => void act(() => api.acceptFriend(profile.friendshipId!))}
              >
                <Check /> 친구 수락
              </button>
            )}
            {profile.relationship === 'PENDING_OUTGOING' && (
              <span className="tag">친구 요청 보냄</span>
            )}
            {profile.relationship === 'FRIEND' && <span className="tag green">친구</span>}
          </div>
        )}
      </header>
      <dl className="public-profile-stats">
        <div>
          <dt>레벨</dt>
          <dd>LV.{profile.level}</dd>
        </div>
        <div>
          <dt>XP</dt>
          <dd>{profile.totalXp.toLocaleString()}</dd>
        </div>
        <div>
          <dt>해결</dt>
          <dd>{profile.solvedCount}</dd>
        </div>
        <button onClick={() => setTab('followers')}>
          <dt>팔로워</dt>
          <dd>{profile.followerCount}</dd>
        </button>
        <button onClick={() => setTab('following')}>
          <dt>팔로잉</dt>
          <dd>{profile.followingCount}</dd>
        </button>
        <div>
          <dt>친구</dt>
          <dd>{profile.friendCount}</dd>
        </div>
      </dl>
      <section className="community-panel public-profile-content">
        <div className="guide-tabs public-profile-tabs">
          <button className={tab === 'activity' ? 'active' : ''} onClick={() => setTab('activity')}>
            최근 활동
          </button>
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
        {tab === 'activity' ? (
          <ol className="profile-activity-list">
            {profile.recentActivity.length ? (
              profile.recentActivity.map((activity) => (
                <li key={`${activity.id}-${activity.occurredAt}`}>
                  <Terminal />
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
        ) : (
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
        )}
      </section>
    </section>
  );
}

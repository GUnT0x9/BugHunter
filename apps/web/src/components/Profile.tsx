import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactElement,
} from 'react';
import { ArrowRight, CalendarDays, Check, Pencil, Terminal, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProfileSummary, User } from '@bughunter/contracts';
import { api } from '../lib/api.js';
import { ProgressBar } from './ui/ProgressBar.js';
import type { Progress } from './Shell.js';

type ProfileProps = { user: User; progress: Progress | null; onUserUpdated: (user: User) => void };
const DAY_MS = 86_400_000;
const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : '요청을 처리하지 못했습니다.';
const dateLabel = (value: string): string =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }).format(
    new Date(value),
  );

export function Profile({ user, progress, onUserUpdated }: ProfileProps): ReactElement {
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void api
      .profileSummary()
      .then(setSummary)
      .catch((error: unknown) => setLoadError(errorMessage(error)));
  }, []);

  const heatmap = useMemo(() => {
    const counts = new Map(summary?.activityDays.map((day) => [day.date, day.count]) ?? []);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return Array.from({ length: 84 }, (_, index) => {
      const date = new Date(today.getTime() - (83 - index) * DAY_MS);
      const key = date.toISOString().slice(0, 10);
      return { date: key, count: counts.get(key) ?? 0 };
    });
  }, [summary]);

  async function save(event: FormEvent): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      onUserUpdated(await api.updateProfile({ username, bio }));
      setEditing(false);
    } catch (error: unknown) {
      setSaveError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function cancelEditing(): void {
    if (saving) return;
    setUsername(user.username);
    setBio(user.bio);
    setSaveError('');
    setEditing(false);
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLFormElement>): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    cancelEditing();
  }

  return (
    <section className="page profile-page">
      <header className="profile-identity">
        <div className="profile-avatar" aria-hidden="true">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="profile-heading">
          <div className="profile-name-editor">
            {editing ? (
              <form
                className="profile-name-form"
                onSubmit={(event) => void save(event)}
                onKeyDown={handleEditorKeyDown}
              >
                <input
                  id="profile-username"
                  aria-label="프로필 이름"
                  aria-describedby={saveError ? 'profile-save-error' : undefined}
                  value={username}
                  maxLength={32}
                  autoComplete="nickname"
                  autoFocus
                  disabled={saving}
                  onChange={(event) => setUsername(event.target.value)}
                />
                <textarea
                  aria-label="자기소개"
                  value={bio}
                  maxLength={160}
                  disabled={saving}
                  placeholder="어떤 디버거인지 소개해주세요."
                  onChange={(event) => setBio(event.target.value)}
                />
                <button className="btn primary profile-name-action" type="submit" disabled={saving}>
                  <Check aria-hidden="true" /> {saving ? '저장 중…' : '저장'}
                </button>
                <button
                  className="btn ghost profile-name-action"
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <X aria-hidden="true" /> 취소
                </button>
              </form>
            ) : (
              <div className="profile-name-row">
                <h1>{user.username}</h1>
                <button
                  className="profile-edit-button"
                  type="button"
                  onClick={() => {
                    setUsername(user.username);
                    setBio(user.bio);
                    setSaveError('');
                    setEditing(true);
                  }}
                >
                  <Pencil aria-hidden="true" /> 편집
                </button>
              </div>
            )}
            {editing && saveError && (
              <p id="profile-save-error" className="form-error" aria-live="polite">
                {saveError}
              </p>
            )}
          </div>
          <p>
            LV.{progress?.level ?? 1} · {user.role === 'ADMIN' ? '관리자' : '디버거'}
          </p>
          <p className="profile-bio">{user.bio || '아직 자기소개가 없습니다.'}</p>
          <ProgressBar
            label="현재 레벨 경험치"
            value={progress?.xpIntoLevel ?? 0}
            max={progress?.xpForNextLevel ?? 1000}
            readout={`${progress?.xpIntoLevel ?? 0} / ${progress?.xpForNextLevel ?? 1000} XP`}
          />
          <span className="profile-joined">
            <CalendarDays aria-hidden="true" />
            {summary ? `${dateLabel(summary.joinedAt)} 가입` : '가입일 불러오는 중'}
          </span>
        </div>
        <Link className="btn primary profile-continue" to="/problems">
          학습 계속하기 <ArrowRight aria-hidden="true" />
        </Link>
      </header>

      {loadError && <p className="form-error">{loadError}</p>}
      <div className="profile-content">
        <section className="profile-section" aria-labelledby="activity-heading">
          <div className="profile-section-title">
            <h2 id="activity-heading">학습 기록</h2>
            <span>최근 12주</span>
          </div>
          <div className="profile-heatmap" aria-label="최근 12주 학습 기록">
            {heatmap.map((day) => (
              <span
                key={day.date}
                className={day.count ? 'active' : ''}
                title={`${day.date}: ${day.count ? '학습함' : '학습 없음'}`}
              />
            ))}
          </div>
          <div className="heatmap-legend">
            <span>적음</span>
            <i />
            <i className="active" />
            <span>많음</span>
          </div>
        </section>

        <section className="profile-section" aria-labelledby="recent-heading">
          <div className="profile-section-title">
            <h2 id="recent-heading">최근 활동</h2>
          </div>
          <ol className="profile-activity-list">
            {summary?.recentActivity.length ? (
              summary.recentActivity.map((activity) => (
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
              <li className="profile-empty">아직 완료한 문제가 없습니다.</li>
            )}
          </ol>
        </section>
      </div>

      <dl className="profile-stat-strip">
        <div>
          <dt>해결한 문제</dt>
          <dd>{summary?.solvedCount ?? 0}</dd>
        </div>
        <div>
          <dt>제출</dt>
          <dd>{summary?.totalSubmissions ?? 0}</dd>
        </div>
        <div>
          <dt>평균 시도</dt>
          <dd>{summary?.averageAttempts ?? 0}</dd>
        </div>
        <div>
          <dt>평균 실행 시간</dt>
          <dd>
            {summary?.averageExecutionTimeMs ?? 0}
            <small>ms</small>
          </dd>
        </div>
      </dl>
    </section>
  );
}

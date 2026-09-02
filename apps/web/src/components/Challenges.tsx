import { useEffect, useState, type ReactElement } from 'react';
import { CalendarDays, Check, Flag, Gift, Star, Swords, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Empty } from './ui/Empty.js';

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(value));

export function Challenges({ onReward }: { onReward: () => void }): ReactElement {
  const [coop, setCoop] = useState<Awaited<ReturnType<typeof api.cooperativeChallenge>> | null>(
    null,
  );
  const [event, setEvent] = useState<Awaited<ReturnType<typeof api.communityEvent>> | null>(null);
  const [claiming, setClaiming] = useState<'coop' | 'event' | ''>('');
  const [error, setError] = useState('');
  async function load(): Promise<void> {
    const [nextCoop, nextEvent] = await Promise.all([
      api.cooperativeChallenge(),
      api.communityEvent(),
    ]);
    setCoop(nextCoop);
    setEvent(nextEvent);
  }
  useEffect(() => {
    void load().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : '챌린지를 불러오지 못했습니다.'),
    );
  }, []);
  async function claim(): Promise<void> {
    setClaiming('coop');
    setError('');
    try {
      await api.claimCooperativeChallenge();
      await load();
      onReward();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : '보상을 받지 못했습니다.');
    } finally {
      setClaiming('');
    }
  }
  async function claimEvent(): Promise<void> {
    setClaiming('event');
    setError('');
    try {
      await api.claimCommunityEvent();
      await load();
      onReward();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : '이벤트 보상을 받지 못했습니다.');
    } finally {
      setClaiming('');
    }
  }
  const percentage = coop ? Math.round((coop.globalProgress / coop.globalTarget) * 100) : 0;
  return (
    <section className="page challenges-page">
      <header className="challenges-hero">
        <div>
          <span className="page-kicker">LIVE OPERATIONS</span>
          <h1>챌린지</h1>
          <p>혼자 쌓은 실력을 공동 목표와 경쟁 기록으로 확장합니다.</p>
        </div>
        <Swords />
      </header>
      {error && <Empty tone="error" text={error} />}
      {coop && (
        <section className={`coop-operation ${coop.completed ? 'completed' : ''}`}>
          <header>
            <div>
              <span>WEEKLY CO-OP</span>
              <h2>{coop.title}</h2>
              <p>{coop.description}</p>
            </div>
            <small>
              <CalendarDays /> {dateLabel(coop.startsAt)} – {dateLabel(coop.endsAt)}
            </small>
          </header>
          <div className="coop-progress-copy">
            <strong>
              {coop.globalProgress}
              <small> / {coop.globalTarget}</small>
            </strong>
            <span>{percentage}% COMPLETE</span>
          </div>
          <div
            className="coop-progress-track"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${percentage}%` }} />
          </div>
          <dl className="coop-stats">
            <div>
              <dt>
                <Users /> 참여 디버거
              </dt>
              <dd>{coop.contributorCount}명</dd>
            </div>
            <div>
              <dt>
                <Flag /> 내 기여도
              </dt>
              <dd>{coop.contribution}문제</dd>
            </div>
            <div>
              <dt>
                <Gift /> 예상 보상
              </dt>
              <dd>{coop.rewardXp} XP</dd>
            </div>
          </dl>
          <footer>
            <p>문제당 20 XP · 개인 최대 500 XP · 목표 달성 후 참여자만 수령</p>
            <button
              className={coop.completed && !coop.claimed ? 'btn primary' : 'btn'}
              disabled={
                !coop.completed || coop.contribution === 0 || coop.claimed || Boolean(claiming)
              }
              onClick={() => void claim()}
            >
              {coop.claimed ? (
                <>
                  <Check /> 수령 완료
                </>
              ) : claiming === 'coop' ? (
                '처리 중…'
              ) : (
                '협동 보상 받기'
              )}
            </button>
          </footer>
        </section>
      )}
      {event && (
        <section className={`community-event category-${event.category.slug}`}>
          <header>
            <div>
              <span>WEEKLY CATEGORY EVENT</span>
              <h2>{event.title}</h2>
              <p>{event.description}</p>
            </div>
            <div className="event-rank">
              <small>내 순위</small>
              <strong>#{event.me.rank}</strong>
            </div>
          </header>
          <div className="event-layout">
            <div className="event-objective">
              <span>MISSION OBJECTIVE</span>
              <strong>
                {event.me.solvedCount}
                <small> / {event.target}문제</small>
              </strong>
              <div>
                <i
                  style={{
                    width: `${Math.min(100, (event.me.solvedCount / event.target) * 100)}%`,
                  }}
                />
              </div>
              <dl>
                <div>
                  <dt>획득 별</dt>
                  <dd>{event.me.earnedStars}</dd>
                </div>
                <div>
                  <dt>보상</dt>
                  <dd>{event.rewardXp} XP</dd>
                </div>
                <div>
                  <dt>기간</dt>
                  <dd>
                    {dateLabel(event.startsAt)}–{dateLabel(event.endsAt)}
                  </dd>
                </div>
              </dl>
              <button
                className={event.completed && !event.claimed ? 'btn primary' : 'btn'}
                disabled={!event.completed || event.claimed || Boolean(claiming)}
                onClick={() => void claimEvent()}
              >
                {event.claimed ? (
                  <>
                    <Check /> 수령 완료
                  </>
                ) : claiming === 'event' ? (
                  '처리 중…'
                ) : (
                  '이벤트 보상 받기'
                )}
              </button>
            </div>
            <ol className="event-ranking">
              {event.entries.slice(0, 10).map((entry) => (
                <li className={entry.isSelf ? 'is-me' : ''} key={entry.id}>
                  <b>#{entry.rank}</b>
                  <Link to={`/community/users/${entry.id}`}>{entry.username}</Link>
                  <span>{entry.solvedCount}문제</span>
                  <strong>
                    <Star /> {entry.earnedStars}
                  </strong>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
      <div className="challenge-mode-grid one-mode">
        <article>
          <Swords />
          <span>HEAD TO HEAD</span>
          <h2>같은 문제 경쟁</h2>
          <p>동일 문제의 해결 기록을 공정한 기준으로 비교합니다.</p>
          <small>다음 규칙 설정 대기</small>
        </article>
      </div>
    </section>
  );
}

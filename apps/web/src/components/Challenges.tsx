import { useEffect, useState, type ReactElement } from 'react';
import { CalendarDays, Check, Flag, Gift, Swords, Users } from 'lucide-react';
import { api } from '../lib/api.js';
import { Empty } from './ui/Empty.js';

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(value));

export function Challenges({ onReward }: { onReward: () => void }): ReactElement {
  const [coop, setCoop] = useState<Awaited<ReturnType<typeof api.cooperativeChallenge>> | null>(
    null,
  );
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  async function load(): Promise<void> {
    setCoop(await api.cooperativeChallenge());
  }
  useEffect(() => {
    void load().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : '챌린지를 불러오지 못했습니다.'),
    );
  }, []);
  async function claim(): Promise<void> {
    setClaiming(true);
    setError('');
    try {
      await api.claimCooperativeChallenge();
      await load();
      onReward();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : '보상을 받지 못했습니다.');
    } finally {
      setClaiming(false);
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
              disabled={!coop.completed || coop.contribution === 0 || coop.claimed || claiming}
              onClick={() => void claim()}
            >
              {coop.claimed ? (
                <>
                  <Check /> 수령 완료
                </>
              ) : claiming ? (
                '처리 중…'
              ) : (
                '협동 보상 받기'
              )}
            </button>
          </footer>
        </section>
      )}
      <div className="challenge-mode-grid two-modes">
        <article>
          <Flag />
          <span>COMMUNITY</span>
          <h2>커뮤니티 이벤트</h2>
          <p>기간과 카테고리가 바뀌는 테마형 도전입니다.</p>
          <small>다음 규칙 설정 대기</small>
        </article>
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

import { useEffect, useRef, useState, type ReactElement } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Flag,
  Gift,
  Star,
  Swords,
  Users,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import type { DuelHistory, DuelRoom } from '../lib/api.js';
import { Empty } from './ui/Empty.js';

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(value));

export function Challenges({
  onReward,
  mode,
}: {
  onReward: () => void;
  mode?: 'duel' | 'coop' | 'event';
}): ReactElement {
  const [coop, setCoop] = useState<Awaited<ReturnType<typeof api.cooperativeChallenge>> | null>(
    null,
  );
  const [event, setEvent] = useState<Awaited<ReturnType<typeof api.communityEvent>> | null>(null);
  const [claiming, setClaiming] = useState<'coop' | 'event' | ''>('');
  const [error, setError] = useState('');
  const [duel, setDuel] = useState<DuelRoom | null>(null);
  const [difficulty, setDifficulty] = useState(3);
  const [joinCode, setJoinCode] = useState('');
  const [duelBusy, setDuelBusy] = useState(false);
  const [duelHistory, setDuelHistory] = useState<DuelHistory | null>(null);
  async function load(): Promise<void> {
    if (mode === 'coop') {
      setCoop(await api.cooperativeChallenge());
      return;
    }
    if (mode === 'event') setEvent(await api.communityEvent());
  }
  useEffect(() => {
    if (mode !== 'coop' && mode !== 'event') return;
    void load().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : '챌린지를 불러오지 못했습니다.'),
    );
  }, [mode]);
  useEffect(() => {
    if (mode !== 'duel') return;
    void Promise.all([api.activeDuel(), api.duelHistory()])
      .then(([active, history]) => {
        setDuelHistory(history);
        if (active) {
          sessionStorage.setItem('duel-last', active.id);
          setDuel(active);
          return;
        }
        const lastId = sessionStorage.getItem('duel-last');
        if (!lastId) {
          setDuel(null);
          return;
        }
        void api
          .duel(lastId)
          .then((last) => setDuel(last))
          .catch(() => {
            sessionStorage.removeItem('duel-last');
            setDuel(null);
          });
      })
      .catch(() => null);
  }, [mode]);
  useEffect(() => {
    if (!duel) return;
    sessionStorage.setItem('duel-last', duel.id);
    if (!['WAITING', 'ACTIVE'].includes(duel.status)) return;
    const timer = window.setInterval(
      () =>
        void api
          .duel(duel.id)
          .then((next) => {
            setDuel(next);
            if (next.status === 'FINISHED') {
              sessionStorage.setItem('duel-last', next.id);
              void api
                .duelHistory()
                .then(setDuelHistory)
                .catch(() => null);
              onReward();
            }
          })
          .catch(() => null),
      2_000,
    );
    return () => window.clearInterval(timer);
  }, [duel?.id, duel?.status]);

  async function createDuel(nextDifficulty = difficulty): Promise<void> {
    setDuelBusy(true);
    setError('');
    try {
      setDifficulty(nextDifficulty);
      sessionStorage.removeItem('duel-entered');
      setDuel(await api.createDuel(nextDifficulty));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '대결방을 만들지 못했습니다.');
    } finally {
      setDuelBusy(false);
    }
  }
  async function joinDuel(): Promise<void> {
    setDuelBusy(true);
    setError('');
    try {
      sessionStorage.removeItem('duel-entered');
      setDuel(await api.joinDuel(joinCode));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '대결방에 참가하지 못했습니다.');
    } finally {
      setDuelBusy(false);
    }
  }
  async function startDuel(): Promise<void> {
    if (!duel) return;
    setDuelBusy(true);
    setError('');
    try {
      setDuel(await api.startDuel(duel.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '대결을 시작하지 못했습니다.');
    } finally {
      setDuelBusy(false);
    }
  }
  async function cancelDuel(): Promise<void> {
    if (!duel) return;
    setDuelBusy(true);
    try {
      await api.cancelDuel(duel.id);
      sessionStorage.removeItem('duel-last');
      sessionStorage.removeItem('duel-entered');
      setDuel(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '대결방을 취소하지 못했습니다.');
    } finally {
      setDuelBusy(false);
    }
  }
  function leaveDuel(): void {
    sessionStorage.removeItem('duel-last');
    sessionStorage.removeItem('duel-entered');
    setDuel(null);
  }
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
  if (!mode) return <ChallengeSystemSelect />;
  return (
    <section className="page challenges-page">
      <header className="challenges-hero">
        <div>
          <Link className="challenge-back" to="/challenges">
            <ArrowLeft /> SYSTEM SELECT
          </Link>
          <span className="page-kicker">
            {mode === 'duel'
              ? 'SYSTEM 01 / HEAD TO HEAD'
              : mode === 'coop'
                ? 'SYSTEM 02 / WEEKLY CO-OP'
                : 'SYSTEM 03 / CATEGORY EVENT'}
          </span>
          <h1>
            {mode === 'duel'
              ? '1대1 문제 대결'
              : mode === 'coop'
                ? '주간 협동 작전'
                : '카테고리 이벤트'}
          </h1>
          <p>
            {mode === 'duel'
              ? '같은 문제를 동시에 해결하고 먼저 정답에 도달하세요.'
              : mode === 'coop'
                ? '모든 디버거와 함께 주간 목표를 완수하세요.'
                : '이번 주 지정 카테고리에서 순위와 보상을 획득하세요.'}
          </p>
        </div>
        <Swords />
      </header>
      {error && <Empty tone="error" text={error} />}
      {mode === 'coop' && coop && (
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
      {mode === 'event' && event && (
        <section className={`community-event category-${event.category.slug}`}>
          <header>
            <div>
              <span>WEEKLY CATEGORY EVENT</span>
              <h2>{event.title}</h2>
              <p>{event.description}</p>
            </div>
            <div className="event-rank">
              <small>내 순위</small>
              <strong>{event.me.rank > 0 ? `#${event.me.rank}` : '관전자'}</strong>
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
      {mode === 'duel' && (
        <DuelPanel
          duel={duel}
          difficulty={difficulty}
          joinCode={joinCode}
          busy={duelBusy}
          onDifficulty={setDifficulty}
          onCode={(value) =>
            setJoinCode(
              value
                .toUpperCase()
                .replace(/[^A-F0-9]/g, '')
                .slice(0, 6),
            )
          }
          onCreate={() => void createDuel()}
          onJoin={() => void joinDuel()}
          onStart={() => void startDuel()}
          onCancel={() => void cancelDuel()}
          onLeave={() => leaveDuel()}
          onRematch={(nextDifficulty) => void createDuel(nextDifficulty)}
        />
      )}
      {mode === 'duel' && duelHistory && <DuelHistoryPanel data={duelHistory} />}
    </section>
  );
}

function ChallengeSystemSelect(): ReactElement {
  const systems = [
    {
      number: '01',
      to: '/challenges/duel',
      icon: <Swords />,
      eyebrow: 'HEAD TO HEAD',
      title: '1대1 문제 대결',
      description: '같은 문제, 같은 제한 시간. 먼저 버그를 해결한 디버거가 승리합니다.',
      meta: '2 PLAYERS · 15 MIN',
    },
    {
      number: '02',
      to: '/challenges/co-op',
      icon: <Users />,
      eyebrow: 'WEEKLY CO-OP',
      title: '주간 협동 작전',
      description: '모든 디버거의 해결 기록을 모아 공동 목표와 XP 보상을 해제합니다.',
      meta: 'GLOBAL · WEEKLY',
    },
    {
      number: '03',
      to: '/challenges/event',
      icon: <Star />,
      eyebrow: 'CATEGORY EVENT',
      title: '카테고리 이벤트',
      description: '매주 바뀌는 버그 카테고리에서 별을 모으고 순위를 경쟁합니다.',
      meta: 'ROTATING · RANKED',
    },
  ];
  return (
    <section className="page system-select-page">
      <header>
        <span>SYSTEM SELECT</span>
        <h1>원하는 시스템을 선택하세요</h1>
        <p>각 시스템은 독립된 작전 화면에서 진행됩니다.</p>
      </header>
      <div className="system-select-frame">
        <div className="system-select-cards">
          {systems.map((system) => (
            <Link
              className={`system-card system-${system.number}`}
              to={system.to}
              key={system.number}
            >
              <div className="system-card-scanline" />
              <span className="system-number">SYSTEM {system.number}</span>
              <span className="system-icon">{system.icon}</span>
              <div>
                <small>{system.eyebrow}</small>
                <h2>{system.title}</h2>
                <p>{system.description}</p>
              </div>
              <footer>
                <span>{system.meta}</span>
                <b>
                  ENTER <ArrowRight />
                </b>
              </footer>
            </Link>
          ))}
        </div>
      </div>
      <small className="system-select-status">
        <i /> ALL SYSTEMS ONLINE
      </small>
    </section>
  );
}

function DuelPanel({
  duel,
  difficulty,
  joinCode,
  busy,
  onDifficulty,
  onCode,
  onCreate,
  onJoin,
  onStart,
  onCancel,
  onLeave,
  onRematch,
}: {
  duel: DuelRoom | null;
  difficulty: number;
  joinCode: string;
  busy: boolean;
  onDifficulty: (value: number) => void;
  onCode: (value: string) => void;
  onCreate: () => void;
  onJoin: () => void;
  onStart: () => void;
  onCancel: () => void;
  onLeave: () => void;
  onRematch: (difficulty: number) => void;
}): ReactElement {
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());
  const enteredRef = useRef(sessionStorage.getItem('duel-entered'));
  useEffect(() => {
    if (duel?.status !== 'ACTIVE') return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [duel?.status]);
  useEffect(() => {
    if (duel?.status === 'FINISHED' || duel?.status === 'CANCELLED') {
      sessionStorage.removeItem('duel-entered');
      enteredRef.current = null;
    }
  }, [duel?.status, duel?.id]);
  useEffect(() => {
    if (duel?.status !== 'ACTIVE' || enteredRef.current === duel.id) return;
    enteredRef.current = duel.id;
    sessionStorage.setItem('duel-entered', duel.id);
    navigate(`/problems/${duel.mission.id}?duel=${duel.id}`);
  }, [duel?.status, duel?.id, duel?.mission.id, navigate]);
  const remainingSeconds = duel
    ? Math.max(0, Math.ceil((new Date(duel.expiresAt).getTime() - now) / 1_000))
    : 0;
  const isHost = duel ? duel.participants[0]?.id === duel.meId : false;
  const fullHouse = duel ? duel.participants.length >= 2 : false;
  if (duel)
    return (
      <section className={`duel-arena status-${duel.status.toLowerCase()}`}>
        <header>
          <div>
            <span>HEAD TO HEAD · {duel.status}</span>
            <h2>
              {duel.status === 'WAITING'
                ? `난이도 ${duel.mission.difficulty} 랜덤 문제`
                : duel.mission.title}
            </h2>
          </div>
          <div className="duel-room-meta">
            <strong>{duel.code}</strong>
            {duel.status === 'ACTIVE' && (
              <time>
                {String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:
                {String(remainingSeconds % 60).padStart(2, '0')}
              </time>
            )}
          </div>
        </header>
        <div className="duel-contenders">
          {duel.participants.map((player, index) => (
            <article className={duel.winnerId === player.id ? 'winner' : ''} key={player.id}>
              <span>{index === 0 ? 'HOST' : 'CHALLENGER'}</span>
              <h3>
                {player.username}
                {player.id === duel.meId ? ' (나)' : ''}
              </h3>
              <dl>
                <div>
                  <dt>제출</dt>
                  <dd>{player.attempts}회</dd>
                </div>
                <div>
                  <dt>힌트</dt>
                  <dd>{player.hintUsed ? '사용' : '미사용'}</dd>
                </div>
                <div>
                  <dt>상태</dt>
                  <dd>{player.solvedAt ? '해결' : '도전 중'}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        {duel.status === 'WAITING' && (
          <p className="duel-notice">
            상대에게 참가 코드 <b>{duel.code}</b>를 알려주세요.
            {fullHouse
              ? isHost
                ? ' 두 명이 모였습니다. 시작을 눌러 동시에 입장하세요.'
                : ' 방장이 시작을 누르면 동시에 문제로 이동합니다.'
              : ' 상대를 기다리는 중입니다.'}
          </p>
        )}
        {duel.status === 'ACTIVE' && (
          <p className="duel-notice">
            먼저 정답을 제출한 디버거가 승리합니다. 제한 시간은 15분입니다. 문제를 다 풀면
            대기실로 돌아와 결과를 확인하세요.
          </p>
        )}
        {duel.status === 'FINISHED' && (
          <p className="duel-result">
            {duel.winnerId
              ? `${duel.participants.find((item) => item.id === duel.winnerId)?.username} 승리`
              : '제한 시간 종료'}
            {duel.winnerId === duel.meId && (
              <small>
                {duel.rewardXp ? `+${duel.rewardXp} XP 획득` : '오늘의 반복/일일 보상 한도 도달'}
              </small>
            )}
          </p>
        )}
        <footer>
          {duel.status === 'ACTIVE' && (
            <Link className="btn primary" to={`/problems/${duel.mission.id}?duel=${duel.id}`}>
              문제 풀러 가기
            </Link>
          )}
          {duel.status === 'WAITING' && isHost && (
            <>
              <button className="btn primary" disabled={busy || !fullHouse} onClick={onStart}>
                {fullHouse ? '대결 시작' : '상대 대기 중…'}
              </button>
              <button className="btn" disabled={busy} onClick={onCancel}>
                방 취소
              </button>
            </>
          )}
          {duel.status === 'WAITING' && !isHost && (
            <span className="duel-notice">방장이 시작하기를 기다리는 중입니다.</span>
          )}
          {duel.status === 'FINISHED' && (
            <>
              <button
                className="btn primary"
                disabled={busy}
                onClick={() => onRematch(duel.mission.difficulty)}
              >
                같은 난이도 재대결
              </button>
              <button
                className="btn"
                disabled={busy}
                onClick={() => {
                  sessionStorage.removeItem('duel-last');
                  sessionStorage.removeItem('duel-entered');
                  onLeave();
                }}
              >
                로비로 나가기
              </button>
            </>
          )}
          {duel.status === 'CANCELLED' && (
            <button
              className="btn"
              onClick={() => {
                sessionStorage.removeItem('duel-last');
                sessionStorage.removeItem('duel-entered');
                onLeave();
              }}
            >
              새 대결 준비
            </button>
          )}
        </footer>
      </section>
    );
  return (
    <section className="duel-lobby">
      <header>
        <Swords />
        <div>
          <span>HEAD TO HEAD</span>
          <h2>같은 문제 경쟁</h2>
          <p>코드 하나로 상대를 초대하고 동일한 문제를 동시에 해결하세요.</p>
        </div>
      </header>
      <div className="duel-lobby-grid">
        <div>
          <h3>대결방 만들기</h3>
          <select
            value={difficulty}
            onChange={(event) => onDifficulty(Number(event.target.value))}
            aria-label="대결 난이도"
          >
            {[1, 2, 3, 4, 5].map((level) => (
              <option value={level} key={level}>
                난이도 {level} · 랜덤 문제
              </option>
            ))}
          </select>
          <button className="btn primary" disabled={busy} onClick={onCreate}>
            방 만들기
          </button>
        </div>
        <div>
          <h3>참가 코드 입력</h3>
          <input
            value={joinCode}
            onChange={(event) => onCode(event.target.value)}
            placeholder="6자리 코드"
            maxLength={6}
          />
          <button className="btn" disabled={busy || joinCode.length !== 6} onClick={onJoin}>
            대결 참가
          </button>
        </div>
      </div>
      <small>
        난이도를 고르면 시작할 때 둘 다 같은 문제를 랜덤으로 받습니다. 푼 문제도 다시
        나올 수 있습니다. 승리 기준: 해결 시각 → 제출 횟수 → 힌트 미사용 · 제한 시간
        15분
      </small>
    </section>
  );
}

function DuelHistoryPanel({ data }: { data: DuelHistory }): ReactElement {
  return (
    <section className="duel-history">
      <header>
        <div>
          <span>MATCH RECORD</span>
          <h2>대결 전적</h2>
        </div>
        <dl>
          <div>
            <dt>승률</dt>
            <dd>{data.summary.winRate}%</dd>
          </div>
          <div>
            <dt>전적</dt>
            <dd>
              {data.summary.wins}승 {data.summary.losses}패 {data.summary.draws}무
            </dd>
          </div>
          <div>
            <dt>연승</dt>
            <dd>{data.summary.streak}</dd>
          </div>
        </dl>
      </header>
      {data.entries.length ? (
        <ol>
          {data.entries.map((entry) => (
            <li key={entry.id} className={`result-${entry.result.toLowerCase()}`}>
              <b>{entry.result}</b>
              <div>
                <strong>{entry.opponent?.username ?? '상대 없음'}</strong>
                <small>{entry.mission.title}</small>
              </div>
              <span>
                {entry.attempts}회 제출 · 힌트 {entry.hintUsed ? '사용' : '미사용'}
              </span>
              <em>{entry.rewardXp ? `+${entry.rewardXp} XP` : '—'}</em>
            </li>
          ))}
        </ol>
      ) : (
        <p>아직 완료한 대결이 없습니다.</p>
      )}
      <footer>승리 50 XP · 일일 최대 300 XP · 같은 상대는 하루 3승까지 보상</footer>
    </section>
  );
}

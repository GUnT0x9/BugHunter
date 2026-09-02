import { useEffect, useState, type ReactElement } from 'react';
import { Check, Clock3, Gift, ListChecks } from 'lucide-react';
import { api } from '../lib/api.js';
import { Empty } from './ui/Empty.js';

function remainingLabel(endsAt: string, now: number): string {
  const milliseconds = Math.max(0, new Date(endsAt).getTime() - now);
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  return `${hours}시간 ${minutes}분 후 초기화`;
}

export function QuestBoard({ onReward }: { onReward: () => void }): ReactElement {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.quests>> | null>(null);
  const [now, setNow] = useState(Date.now());
  const [claiming, setClaiming] = useState('');
  const [error, setError] = useState('');

  async function load(): Promise<void> {
    setData(await api.quests());
  }
  useEffect(() => {
    void load().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : '퀘스트를 불러오지 못했습니다.'),
    );
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  async function claim(key: string): Promise<void> {
    setClaiming(key);
    setError('');
    try {
      await api.claimQuest(key);
      await load();
      onReward();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : '보상을 받지 못했습니다.');
    } finally {
      setClaiming('');
    }
  }

  return (
    <section className="page quest-page">
      <header className="quest-hero">
        <div>
          <span className="page-kicker">MISSION CONTROL</span>
          <h1>퀘스트 보드</h1>
          <p>매일의 작은 목표와 주간 작전을 완료하고 XP를 획득하세요.</p>
        </div>
        <ListChecks aria-hidden="true" />
      </header>
      {error && <Empty tone="error" text={error} />}
      {!data
        ? !error && <Empty text="퀘스트를 불러오는 중입니다." />
        : (['DAILY', 'WEEKLY'] as const).map((period) => {
            const quests = data.quests.filter((quest) => quest.period === period);
            const endsAt = period === 'DAILY' ? data.dailyEndsAt : data.weeklyEndsAt;
            return (
              <section className="quest-group" key={period}>
                <header>
                  <div>
                    <span>{period}</span>
                    <h2>{period === 'DAILY' ? '일일 퀘스트' : '주간 퀘스트'}</h2>
                  </div>
                  <small>
                    <Clock3 /> {remainingLabel(endsAt, now)}
                  </small>
                </header>
                <div className="quest-list">
                  {quests.map((quest) => {
                    const percentage = Math.round((quest.progress / quest.target) * 100);
                    return (
                      <article className={quest.completed ? 'completed' : ''} key={quest.key}>
                        <div className="quest-check">{quest.completed ? <Check /> : null}</div>
                        <div className="quest-copy">
                          <h3>{quest.title}</h3>
                          <p>{quest.description}</p>
                          <div className="quest-progress">
                            <span style={{ width: `${percentage}%` }} />
                          </div>
                          <small>
                            {quest.progress} / {quest.target}
                          </small>
                        </div>
                        <div className="quest-reward">
                          <span>
                            <Gift /> {quest.rewardXp} XP
                          </span>
                          <button
                            className={quest.completed && !quest.claimed ? 'btn primary' : 'btn'}
                            disabled={!quest.completed || quest.claimed || claiming === quest.key}
                            onClick={() => void claim(quest.key)}
                          >
                            {quest.claimed
                              ? '수령 완료'
                              : claiming === quest.key
                                ? '처리 중…'
                                : '보상 받기'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
    </section>
  );
}

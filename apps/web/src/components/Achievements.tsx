import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { Check, LockKeyhole, Medal } from 'lucide-react';
import { api } from '../lib/api.js';
import { Empty } from './ui/Empty.js';

const GROUP_LABELS: Record<string, string> = {
  START: '입문',
  COLLECTION: '수집',
  PERFECT: '완벽주의',
  NO_HINT: '노힌트',
  FIRST_TRY: '퍼스트 트라이',
  CATEGORY: '카테고리',
  BOSS: '보스',
  STREAK: '연속 학습',
  EXPLORATION: '탐험',
  GROWTH: '성장',
  COMEBACK: '재도전',
  SPEED: '속도',
  COMMUNITY: '커뮤니티',
  SEASON: '시즌',
  SECRET: '비밀',
};
const RARITY_LABELS = { COMMON: '일반', RARE: '희귀', EPIC: '영웅', LEGENDARY: '전설' } as const;

export function Achievements(): ReactElement {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.achievements>> | null>(null);
  const [group, setGroup] = useState('ALL');
  const [error, setError] = useState('');
  useEffect(() => {
    void api
      .achievements()
      .then(setData)
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : '업적을 불러오지 못했습니다.'),
      );
  }, []);
  const groups = useMemo(() => [...new Set(data?.items.map((item) => item.group) ?? [])], [data]);
  const items = data?.items.filter((item) => group === 'ALL' || item.group === group) ?? [];
  return (
    <section className="page achievements-page">
      <header className="achievements-hero">
        <div>
          <span className="page-kicker">ACHIEVEMENT ARCHIVE</span>
          <h1>업적 기록</h1>
          <p>플레이 방식과 성장의 흔적을 수집합니다.</p>
        </div>
        <strong>
          {data?.unlockedCount ?? 0}
          <small> / {data?.totalCount ?? 0} 해금</small>
        </strong>
      </header>
      {data && (
        <nav className="achievement-filters" aria-label="업적 카테고리">
          <button className={group === 'ALL' ? 'active' : ''} onClick={() => setGroup('ALL')}>
            전체
          </button>
          {groups.map((key) => (
            <button
              key={key}
              className={group === key ? 'active' : ''}
              onClick={() => setGroup(key)}
            >
              {GROUP_LABELS[key] ?? key}
            </button>
          ))}
        </nav>
      )}
      {error ? (
        <Empty tone="error" text={error} />
      ) : !data ? (
        <Empty text="업적 기록을 계산하는 중입니다." />
      ) : (
        <div className="achievement-grid">
          {items.map((item) => {
            const ratio = item.target ? Math.round((item.progress / item.target) * 100) : 0;
            return (
              <article
                className={`achievement-card rarity-${item.rarity.toLowerCase()} ${item.unlocked ? 'unlocked' : ''} ${item.secret ? 'secret' : ''}`}
                key={item.code}
              >
                <div className="achievement-mark">
                  {item.unlocked ? <Medal /> : <LockKeyhole />}
                </div>
                <div className="achievement-copy">
                  <span>
                    {RARITY_LABELS[item.rarity]} · {GROUP_LABELS[item.group] ?? item.group}
                    {item.comingSoon ? ' · 준비 중' : ''}
                  </span>
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                </div>
                <div className="achievement-progress">
                  <div>
                    <span style={{ width: `${ratio}%` }} />
                  </div>
                  <small>
                    {item.unlocked ? (
                      <>
                        <Check /> 해금
                      </>
                    ) : (
                      `${item.progress.toLocaleString()} / ${item.target.toLocaleString()}`
                    )}
                  </small>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

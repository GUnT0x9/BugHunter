import { useEffect, useState, type ReactElement } from 'react';
import { ArrowUpRight, Crown, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Empty } from './ui/Empty.js';

export function BugDex(): ReactElement {
  const [items, setItems] = useState<Awaited<ReturnType<typeof api.bugdex>>>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    void api
      .bugdex()
      .then(setItems)
      .catch(() => setFailed(true));
  }, []);
  const totalXp = items.reduce((sum, item) => sum + item.mission.baseXp, 0);
  return (
    <section className="page bugdex-page">
      <header className="bugdex-hero">
        <div>
          <h1 className="page-title">해결한 문제 도감</h1>
          <p>완료한 문제와 해결 기록을 모아봅니다.</p>
        </div>
        <div className="bugdex-summary">
          <span>완료 {items.length}문제</span>
          <span>{totalXp.toLocaleString()} XP</span>
        </div>
      </header>
      {items.length ? (
        <div className="bugdex-grid">
          {items.map((item) => (
            <Link
              className={`bugdex-card ${item.mission.isBoss ? 'is-boss' : ''}`}
              to={`/problems/${item.mission.id}`}
              key={item.mission.id}
            >
              <header>
                <span className="bugdex-card-code">
                  CH.{item.mission.chapter.sortOrder} · M.{item.mission.sortOrder}
                </span>
                {item.mission.isBoss ? (
                  <span className="bugdex-rarity boss">
                    <Crown /> BOSS
                  </span>
                ) : (
                  <span className="bugdex-rarity">완료</span>
                )}
              </header>
              <strong className="bugdex-card-number">
                {String(item.mission.sortOrder).padStart(2, '0')}
              </strong>
              <div className="bugdex-card-copy">
                <span>{item.mission.bugType.name}</span>
                <h2>{item.mission.title}</h2>
                <p>{item.mission.description}</p>
              </div>
              <footer>
                <span>
                  <Target /> LV.{item.mission.difficulty}
                </span>
                <span>{item.attempts}회 시도</span>
                <strong>+{item.mission.baseXp} XP</strong>
                <ArrowUpRight />
              </footer>
            </Link>
          ))}
        </div>
      ) : failed ? (
        <Empty text="문제 도감을 불러오지 못했습니다. 잠시 후 다시 시도해주세요." tone="error" />
      ) : (
        <Empty text="첫 Mission을 완료하면 문제 카드가 이곳에 수집됩니다." />
      )}
    </section>
  );
}

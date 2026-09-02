import { useEffect, useState, type CSSProperties, type ReactElement } from 'react';
import { ArrowUpRight, Bug, CheckCircle2, Crown, Sparkles, Target, Trophy } from 'lucide-react';
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
          <span className="page-kicker">
            <Sparkles /> DEBUG ARCHIVE
          </span>
          <h1 className="page-title">해결한 문제 도감</h1>
          <p>직접 추적하고 고쳐낸 버그들이 하나씩 강력한 디버깅 기록이 됩니다.</p>
        </div>
        <div className="bugdex-summary">
          <span>
            <Trophy /> 수집한 문제
          </span>
          <strong>{items.length.toString().padStart(2, '0')}</strong>
          <small>{totalXp.toLocaleString()} XP 확보</small>
        </div>
      </header>
      {items.length ? (
        <div className="bugdex-grid">
          {items.map((item, index) => (
            <Link
              className={`bugdex-card ${item.mission.isBoss ? 'is-boss' : ''}`}
              to={`/problems/${item.mission.id}`}
              key={item.mission.id}
              style={{ '--card-index': index } as CSSProperties}
            >
              <div className="bugdex-card-glow" />
              <header>
                <span className="bugdex-card-code">
                  CH.{item.mission.chapter.sortOrder} · M.{item.mission.sortOrder}
                </span>
                {item.mission.isBoss ? (
                  <span className="bugdex-rarity boss">
                    <Crown /> BOSS
                  </span>
                ) : (
                  <span className="bugdex-rarity">
                    <CheckCircle2 /> CLEARED
                  </span>
                )}
              </header>
              <div className="bugdex-card-icon">
                <Bug />
              </div>
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

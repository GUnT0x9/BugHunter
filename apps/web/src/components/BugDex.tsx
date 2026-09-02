import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { ArrowUpRight, Crown, Star, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Empty } from './ui/Empty.js';

export function BugDex(): ReactElement {
  const [items, setItems] = useState<Awaited<ReturnType<typeof api.bugdex>>>([]);
  const [mastery, setMastery] = useState<Awaited<ReturnType<typeof api.mastery>>>([]);
  const [failed, setFailed] = useState(false);
  const [category, setCategory] = useState('all');
  useEffect(() => {
    void Promise.all([api.bugdex(), api.mastery()])
      .then(([nextItems, nextMastery]) => {
        setItems(nextItems);
        setMastery(nextMastery);
      })
      .catch(() => setFailed(true));
  }, []);
  const totalXp = items.reduce((sum, item) => sum + item.mission.baseXp, 0);
  const earnedStars = items.reduce((sum, item) => sum + item.rating.stars, 0);
  const categories = useMemo(
    () =>
      Array.from(
        items.reduce((map, item) => {
          const { slug, name } = item.mission.bugType;
          const current = map.get(slug);
          map.set(slug, { slug, name, count: (current?.count ?? 0) + 1 });
          return map;
        }, new Map<string, { slug: string; name: string; count: number }>()),
      ).map(([, value]) => value),
    [items],
  );
  const visibleItems =
    category === 'all' ? items : items.filter((item) => item.mission.bugType.slug === category);
  return (
    <section className="page bugdex-page">
      <header className="bugdex-hero">
        <div>
          <h1 className="page-title">해결한 문제 도감</h1>
          <p>완료한 문제와 해결 기록을 모아봅니다.</p>
        </div>
        <div className="bugdex-summary">
          <span>완료 {items.length}문제</span>
          <span>
            별 {earnedStars}/{items.length * 3}
          </span>
          <span>{totalXp.toLocaleString()} XP</span>
        </div>
      </header>
      {mastery.length > 0 && (
        <section className="mastery-section" aria-labelledby="mastery-title">
          <header>
            <div>
              <span>CATEGORY MASTERY</span>
              <h2 id="mastery-title">카테고리 숙련도</h2>
            </div>
            <p>획득한 별을 기준으로 계산됩니다.</p>
          </header>
          <div className="mastery-grid">
            {mastery.map((item) => (
              <article className={`mastery-item category-${item.slug}`} key={item.slug}>
                <header>
                  <strong>{item.name.replace(' Bug', '')}</strong>
                  <b>{item.percentage}%</b>
                </header>
                <div
                  className="mastery-track"
                  role="progressbar"
                  aria-label={`${item.name} 숙련도`}
                  aria-valuenow={item.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${item.percentage}%` }} />
                </div>
                <footer>
                  <span>
                    별 {item.earnedStars}/{item.totalStars}
                  </span>
                  <span>
                    완료 {item.completedCount}/{item.missionCount}
                  </span>
                </footer>
              </article>
            ))}
          </div>
        </section>
      )}
      {items.length > 0 && (
        <nav className="bugdex-filters" aria-label="문제 카테고리 필터">
          <button
            className={category === 'all' ? 'active' : ''}
            aria-pressed={category === 'all'}
            onClick={() => setCategory('all')}
          >
            전체 <span>{items.length}</span>
          </button>
          {categories.map((item) => (
            <button
              key={item.slug}
              className={category === item.slug ? 'active' : ''}
              aria-pressed={category === item.slug}
              onClick={() => setCategory(item.slug)}
            >
              {item.name.replace(' Bug', '')} <span>{item.count}</span>
            </button>
          ))}
        </nav>
      )}
      {items.length ? (
        <div className="bugdex-grid">
          {visibleItems.map((item) => (
            <Link className="bugdex-card" to={`/problems/${item.mission.id}`} key={item.mission.id}>
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
              <strong className={`bugdex-card-number category-${item.mission.bugType.slug}`}>
                {String(item.mission.sortOrder).padStart(2, '0')}
              </strong>
              <div className="bugdex-card-copy">
                <span>{item.mission.bugType.name}</span>
                <h2>{item.mission.title}</h2>
                <div
                  className={`mission-stars category-${item.mission.bugType.slug}`}
                  aria-label={`별 ${item.rating.stars}개 중 3개`}
                  title="클리어 · 힌트 미사용 · 첫 제출 성공"
                >
                  {[1, 2, 3].map((star) => (
                    <Star key={star} className={star <= item.rating.stars ? 'earned' : ''} />
                  ))}
                  <small>{item.rating.stars}/3</small>
                </div>
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

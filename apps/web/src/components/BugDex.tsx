import { useEffect, useState, type ReactElement } from 'react';
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

  return (
    <section className="page">
      <h1 className="page-title">버그 도감</h1>
      {items.length ? (
        <div className="bugdex-list">
          {items.map((item, index) => (
            <article className="bugdex-row" key={item.bugType.name}>
              <span className="bx-code">BUG-{String(index + 1).padStart(3, '0')}</span>
              <h2>{item.bugType.name}</h2>
              <p>{item.bugType.description}</p>
              <span className="bx-count">{item.discoveredCount}회 해결</span>
            </article>
          ))}
        </div>
      ) : failed ? (
        <Empty text="버그 도감을 불러오지 못했습니다. 잠시 후 다시 시도해주세요." />
      ) : (
        <Empty text="첫 Mission을 완료하면 버그 도감이 채워집니다." />
      )}
    </section>
  );
}
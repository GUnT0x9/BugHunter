import { useEffect, useState, type ReactElement } from 'react';
import { api } from '../lib/api.js';
import { Empty } from './ui/Empty.js';
import { Panel } from './ui/Panel.js';

export function BugDex(): ReactElement {
  const [items, setItems] = useState<Awaited<ReturnType<typeof api.bugdex>>>([]);

  useEffect(() => {
    void api
      .bugdex()
      .then(setItems)
      .catch(() => null);
  }, []);

  return (
    <section className="page">
      <h1 className="page-title">버그 도감</h1>
      <div className="card-grid">
        {items.length ? (
          items.map((item, index) => (
            <Panel title={`BUG-${String(index + 1).padStart(3, '0')}`} key={item.bugType.name}>
              <article className="bug-card">
                <h2>{item.bugType.name}</h2>
                <p>{item.bugType.description}</p>
                <span className="bc-count">{item.discoveredCount}회 해결</span>
              </article>
            </Panel>
          ))
        ) : (
          <Empty text="첫 Mission을 완료하면 버그 도감이 채워집니다." />
        )}
      </div>
    </section>
  );
}
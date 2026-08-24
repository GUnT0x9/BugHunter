import type { ReactElement } from 'react';

export function Empty({ text }: { text: string }): ReactElement {
  return (
    <article className="empty">
      <p>{text}</p>
    </article>
  );
}
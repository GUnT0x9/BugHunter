import type { ReactElement } from 'react';

export function Empty({ text, tone }: { text: string; tone?: 'error' }): ReactElement {
  return (
    <article className={tone === 'error' ? 'empty error' : 'empty'}>
      <p>{text}</p>
    </article>
  );
}

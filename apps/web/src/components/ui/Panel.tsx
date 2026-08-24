import type { ReactElement, ReactNode } from 'react';

type PanelProps = {
  title: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
};

export function Panel({ title, children, className, actions }: PanelProps): ReactElement {
  return (
    <section className={className ? `panel ${className}` : 'panel'}>
      <header className="panel-bar">
        <span className="panel-title">{title}</span>
        {actions && <div className="panel-actions">{actions}</div>}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}
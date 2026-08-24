import type { ReactElement } from 'react';

type ProgressBarProps = {
  value: number;
  max: number;
  readout?: string;
};

export function ProgressBar({ value, max, readout }: ProgressBarProps): ReactElement {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div className="progress-track">
        <i style={{ width: `${percent}%` }} />
      </div>
      {readout !== undefined && <span className="progress-readout">{readout}</span>}
    </div>
  );
}
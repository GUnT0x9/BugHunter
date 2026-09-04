import { useMemo, type ReactElement } from 'react';

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 84;

export type ActivityDay = { date: string; count: number };

type Cell = { date: string; count: number } | null;

const monthDayLabel = (isoDate: string): string =>
  new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(
    new Date(`${isoDate}T00:00:00`),
  );

export function ActivityHeatmap({ days }: { days: ActivityDay[] }): ReactElement {
  const { columns, monthLabels, activeCount } = useMemo(() => {
    const counts = new Map(days.map((day) => [day.date, day.count]));
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const first = new Date(today.getTime() - (WINDOW_DAYS - 1) * DAY_MS);
    const padStart = (first.getDay() + 6) % 7;

    const cells: Cell[] = [];
    for (let i = 0; i < padStart; i += 1) cells.push(null);
    for (let i = 0; i < WINDOW_DAYS; i += 1) {
      const date = new Date(first.getTime() + i * DAY_MS);
      const key = date.toISOString().slice(0, 10);
      cells.push({ date: key, count: counts.get(key) ?? 0 });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const grouped: Cell[][] = [];
    for (let i = 0; i < cells.length; i += 7) grouped.push(cells.slice(i, i + 7));

    let previousMonth = -1;
    const labels = grouped.map((week) => {
      const firstDay = week.find((cell): cell is Exclude<Cell, null> => cell !== null);
      if (!firstDay) return '';
      const month = Number(firstDay.date.slice(5, 7));
      if (month === previousMonth) return '';
      previousMonth = month;
      return `${month}월`;
    });

    return {
      columns: grouped,
      monthLabels: labels,
      activeCount: days.filter((day) => day.count > 0).length,
    };
  }, [days]);

  return (
    <>
      <div className="heatmap-scroll">
      <div className="heatmap-months" aria-hidden="true">
        {monthLabels.map((label, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <span key={index}>{label}</span>
        ))}
      </div>
      <div
        className="profile-heatmap heatmap-noscroll"
        role="img"
        aria-label={`최근 12주 중 ${activeCount}일 학습`}
      >
        {columns.map((week, weekIndex) =>
          week.map((cell, dayIndex) =>
            cell ? (
              <span
                // eslint-disable-next-line react/no-array-index-key
                key={`${weekIndex}-${dayIndex}`}
                className={cell.count ? 'active' : ''}
                title={`${monthDayLabel(cell.date)} · ${cell.count ? '학습함' : '학습 없음'}`}
              />
            ) : (
              // eslint-disable-next-line react/no-array-index-key
              <span key={`${weekIndex}-${dayIndex}`} className="pad" aria-hidden="true" />
            ),
          ),
        )}
      </div>
      </div>
      <div className="heatmap-legend">
        <span>적음</span>
        <i />
        <i className="active" />
        <span>많음</span>
      </div>
    </>
  );
}

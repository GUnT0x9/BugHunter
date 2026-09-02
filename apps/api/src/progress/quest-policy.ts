export type QuestPeriod = {
  key: string;
  startsAt: Date;
  endsAt: Date;
};

function seoulParts(now: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value('year'), month: value('month'), day: value('day') };
}

function seoulMidnightUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, -9));
}

export function questPeriods(now = new Date()): { daily: QuestPeriod; weekly: QuestPeriod } {
  const { year, month, day } = seoulParts(now);
  const dailyStart = seoulMidnightUtc(year, month, day);
  const dailyEnd = new Date(dailyStart.getTime() + 86_400_000);
  const seoulDate = new Date(Date.UTC(year, month - 1, day));
  const daysSinceMonday = (seoulDate.getUTCDay() + 6) % 7;
  const weeklyStart = new Date(dailyStart.getTime() - daysSinceMonday * 86_400_000);
  const weeklyEnd = new Date(weeklyStart.getTime() + 7 * 86_400_000);
  const key = (date: Date) => {
    const shifted = new Date(date.getTime() + 9 * 3_600_000);
    return shifted.toISOString().slice(0, 10);
  };
  return {
    daily: { key: `D:${key(dailyStart)}`, startsAt: dailyStart, endsAt: dailyEnd },
    weekly: { key: `W:${key(weeklyStart)}`, startsAt: weeklyStart, endsAt: weeklyEnd },
  };
}

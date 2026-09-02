export type SeasonPeriod = {
  key: string;
  number: number;
  startsAt: Date;
  endsAt: Date;
};

const SEASON_ZERO_START = Date.parse('2026-08-30T15:00:00.000Z');
const SEASON_LENGTH_MS = 28 * 86_400_000;

export function seasonPeriod(now = new Date()): SeasonPeriod {
  const elapsed = now.getTime() - SEASON_ZERO_START;
  const index = Math.max(0, Math.floor(elapsed / SEASON_LENGTH_MS));
  const startsAt = new Date(SEASON_ZERO_START + index * SEASON_LENGTH_MS);
  return {
    key: `S${index + 1}`,
    number: index + 1,
    startsAt,
    endsAt: new Date(startsAt.getTime() + SEASON_LENGTH_MS),
  };
}

export type SeasonScore = {
  earnedStars: number;
  solvedCount: number;
  averageSolveTimeSeconds: number;
  perfectCount: number;
  totalAttempts: number;
  username: string;
};

export function compareSeasonScores(left: SeasonScore, right: SeasonScore): number {
  return (
    right.earnedStars - left.earnedStars ||
    right.solvedCount - left.solvedCount ||
    left.averageSolveTimeSeconds - right.averageSolveTimeSeconds ||
    right.perfectCount - left.perfectCount ||
    left.totalAttempts - right.totalAttempts ||
    left.username.localeCompare(right.username, 'ko')
  );
}

export function cappedSolveTimeSeconds(startedAt: Date, completedAt: Date): number {
  const seconds = Math.max(0, (completedAt.getTime() - startedAt.getTime()) / 1_000);
  return Math.round(Math.min(seconds, 24 * 3_600));
}

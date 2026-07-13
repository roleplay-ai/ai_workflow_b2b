export type PointsProgressRow = {
  activity_id: string;
  status: string;
  quiz_score?: number | null;
};

/** Max bonus is 25% of base activity points, scaled by quiz score (0–100). */
export const QUIZ_BONUS_RATIO = 0.25;

export function quizBonusPoints(activityPoints: number, quizScore: number | null | undefined): number {
  if (quizScore == null || quizScore <= 0 || activityPoints <= 0) return 0;
  return Math.round(activityPoints * QUIZ_BONUS_RATIO * (quizScore / 100));
}

export function sumPointsFromProgress(
  progress: PointsProgressRow[],
  activityPoints: Record<string, number>,
): number {
  return progress
    .filter(p => p.status === "completed")
    .reduce((sum, p) => {
      const base = activityPoints[p.activity_id] ?? 0;
      return sum + base + quizBonusPoints(base, p.quiz_score);
    }, 0);
}

/** Share of company users with fewer total points (0–100). */
export function companyPointsPercentile(userPoints: number, allUserPoints: number[]): number | null {
  if (allUserPoints.length === 0) return null;
  if (allUserPoints.length === 1) return 100;
  const usersWithFewer = allUserPoints.filter(p => p < userPoints).length;
  return Math.round((usersWithFewer / allUserPoints.length) * 100);
}

export function formatTopPercentile(percentile: number | null, companySize: number): string {
  if (percentile == null || companySize === 0) return "—";
  if (companySize === 1) return "Top 1";
  const topPercent = Math.max(1, Math.min(100, 100 - percentile));
  return `Top ${topPercent}%`;
}

export type PointsStats = {
  user_points: number;
  company_percentile: number | null;
  company_avg_points: number;
  company_size: number;
};

export type LeaderboardEntry = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  points: number;
  rank: number;
};

export type LeaderboardStats = {
  company_size: number;
  top: LeaderboardEntry[];
  me: LeaderboardEntry | null;
};

const AI_LEVELS = [
  { min: 0, label: "Explorer" },
  { min: 200, label: "Builder" },
  { min: 500, label: "Operator" },
  { min: 1000, label: "Strategist" },
  { min: 2000, label: "Master" },
] as const;

/** Point-tier label derived from total points earned, with the next tier's name (if any). */
export function aiLevelForPoints(points: number): { label: string; next: string | null } {
  let current: (typeof AI_LEVELS)[number] = AI_LEVELS[0];
  let next: (typeof AI_LEVELS)[number] | null = null;
  for (let i = 0; i < AI_LEVELS.length; i++) {
    if (points >= AI_LEVELS[i].min) {
      current = AI_LEVELS[i];
      next = AI_LEVELS[i + 1] ?? null;
    }
  }
  return { label: current.label, next: next?.label ?? null };
}

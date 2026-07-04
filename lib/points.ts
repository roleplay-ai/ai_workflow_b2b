export type PointsProgressRow = {
  activity_id: string;
  status: string;
};

export function sumPointsFromProgress(
  progress: PointsProgressRow[],
  activityPoints: Record<string, number>,
): number {
  return progress
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + (activityPoints[p.activity_id] ?? 0), 0);
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

const AI_LEVELS = [
  { min: 0, label: "Explorer" },
  { min: 50, label: "Builder" },
  { min: 150, label: "Operator" },
  { min: 300, label: "Strategist" },
  { min: 500, label: "Master" },
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

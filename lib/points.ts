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

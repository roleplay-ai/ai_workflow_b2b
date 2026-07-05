import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { sumPointsFromProgress, aiLevelForPoints, type PointsStats } from "@/lib/points";
import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

type ProgressRow = { activity_id: string; status: string; completed_at: string | null };
type ActivityRow = { id: string; title: string; description: string | null; categories: string[] | null; points: number; is_featured: boolean; is_locked: boolean };

export type HistoryRow = { id: string; title: string; category: string; points: number; completedAt: string };
export type CategoryProficiency = { category: string; percent: number };
export type Certificate = { title: string; icon: string; earnedAt: string | null; percent: number | null };
export type RecommendedActivity = { id: string; title: string; description: string | null; category: string };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: activities },
    { data: progressRows },
    { data: profileExtras },
    { data: savedWorkflowRows },
  ] = await Promise.all([
    supabase
      .from("activities")
      .select("id, title, description, categories, points, is_featured, is_locked")
      .eq("published", true)
      .order("position"),
    user
      ? supabase.from("user_progress").select("activity_id, status, completed_at").eq("user_id", user.id)
      : Promise.resolve({ data: [] as ProgressRow[] }),
    user
      ? supabase.from("profiles").select("streak_count").eq("id", user.id).single()
      : Promise.resolve({ data: null as { streak_count: number } | null }),
    user
      ? supabase.from("user_saved_workflows").select("activity_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { activity_id: string }[] }),
  ]);

  const activityList = (activities ?? []) as ActivityRow[];
  const activityById = new Map(activityList.map(a => [a.id, a]));
  const activityPoints: Record<string, number> = {};
  for (const a of activityList) activityPoints[a.id] = Number(a.points ?? 0);

  const progress = (progressRows ?? []) as ProgressRow[];
  const completedIds = new Set(progress.filter(r => r.status === "completed").map(r => r.activity_id));
  const inProgressIds = new Set(progress.filter(r => r.status === "in_progress").map(r => r.activity_id));

  const savedWorkflowIds = new Set(
    (savedWorkflowRows ?? []).map(r => (r as { activity_id: string }).activity_id),
  );

  function categoryOf(a: ActivityRow): string {
    return a.categories?.[0]?.trim() || "General";
  }

  const history: HistoryRow[] = progress
    .filter(r => r.status === "completed" && r.completed_at && activityById.has(r.activity_id))
    .map(r => {
      const a = activityById.get(r.activity_id)!;
      return { id: a.id, title: a.title, category: categoryOf(a), points: Number(a.points ?? 0), completedAt: r.completed_at as string };
    })
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  const userTotalPoints = sumPointsFromProgress(progress, activityPoints);
  const completedCount = history.length;
  const inProgressCount = inProgressIds.size;
  const now = Date.now();
  const thisWeekCount = history.filter(h => now - new Date(h.completedAt).getTime() <= WEEK_MS).length;

  const categoryPoints = new Map<string, number>();
  for (const h of history) categoryPoints.set(h.category, (categoryPoints.get(h.category) ?? 0) + h.points);
  let bestCategory: { name: string; points: number } | null = null;
  for (const [name, points] of categoryPoints) {
    if (!bestCategory || points > bestCategory.points) bestCategory = { name, points };
  }

  // Company rank stats — same RPC used on the Workflows page.
  let companyPercentile: number | null = null;
  let companySize = 0;
  let companyAvgPoints = 0;
  if (user) {
    const { data: pointsStats } = await supabase.rpc("get_my_points_stats");
    if (pointsStats && typeof pointsStats === "object") {
      const stats = pointsStats as PointsStats;
      companyPercentile = stats.company_percentile ?? null;
      companySize = stats.company_size ?? 0;
      companyAvgPoints = stats.company_avg_points ?? 0;
    }
  }

  const streakCount = profileExtras?.streak_count ?? 0;
  const aiLevel = aiLevelForPoints(userTotalPoints);

  // Proficiency by category — % of a category's total available points the user has earned.
  const categoryTotals = new Map<string, number>();
  for (const a of activityList) {
    const cat = categoryOf(a);
    categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + Number(a.points ?? 0));
  }
  const proficiency: CategoryProficiency[] = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([category, total]) => ({
      category,
      percent: total > 0 ? Math.round(((categoryPoints.get(category) ?? 0) / total) * 100) : 0,
    }));

  // Milestone certificates, derived from completion count/dates rather than a certificates table.
  const chronological = [...history].sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
  const certificates: Certificate[] = [
    { title: "First Workflow", icon: "🏅", threshold: 1 },
    { title: "5 Workflows Completed", icon: "🎯", threshold: 5 },
    { title: "10 Workflows Completed", icon: "🚀", threshold: 10 },
  ].map(c => {
    const earned = completedCount >= c.threshold;
    return {
      title: c.title,
      icon: c.icon,
      earnedAt: earned ? chronological[c.threshold - 1]?.completedAt ?? null : null,
      percent: earned ? null : Math.round((completedCount / c.threshold) * 100),
    };
  });

  const toRecommended = (a: ActivityRow): RecommendedActivity => ({
    id: a.id,
    title: a.title,
    description: a.description,
    category: categoryOf(a),
  });

  const sortRecommended = (a: ActivityRow, b: ActivityRow) =>
    Number(b.is_featured) - Number(a.is_featured) || Number(b.points) - Number(a.points);

  const isUnlockedNotCompleted = (a: ActivityRow) => !completedIds.has(a.id) && !a.is_locked;

  const myWorkflowRecommended = activityList
    .filter(a => savedWorkflowIds.has(a.id) && isUnlockedNotCompleted(a))
    .sort(sortRecommended);

  const otherRecommended = activityList
    .filter(a => !savedWorkflowIds.has(a.id) && isUnlockedNotCompleted(a) && !inProgressIds.has(a.id))
    .sort(sortRecommended);

  const recommended: RecommendedActivity[] = [...myWorkflowRecommended, ...otherRecommended]
    .slice(0, 3)
    .map(toRecommended);

  return (
    <Suspense fallback={null}>
      <ProfileClient
        history={history}
        userTotalPoints={userTotalPoints}
        completedCount={completedCount}
        inProgressCount={inProgressCount}
        thisWeekCount={thisWeekCount}
        bestCategory={bestCategory}
        companyPercentile={companyPercentile}
        companySize={companySize}
        companyAvgPoints={companyAvgPoints}
        streakCount={streakCount}
        aiLevel={aiLevel}
        proficiency={proficiency}
        certificates={certificates}
        recommended={recommended}
      />
    </Suspense>
  );
}

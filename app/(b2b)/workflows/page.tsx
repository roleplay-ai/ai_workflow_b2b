import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { sumPointsFromProgress, type PointsStats } from "@/lib/points";
import { rowsToToolLogoMap, rowsToTagLogoMap } from "@/lib/toolLogos";
import WorkflowsClient from "./WorkflowsClient";

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: activities },
    { data: toolLogoRows },
    { data: viewRows },
    { data: progressRows },
    { data: modules },
    { data: functionRows },
    { data: tagRows },
  ] = await Promise.all([
    supabase
      .from("activities")
      .select("id, title, description, tools, functions, tags, points, time_estimate_minutes, is_locked, is_featured, published, position, created_at, thumbnail_url")
      .eq("published", true)
      .order("position"),
    supabase.from("tool_logos").select("tool, logo_url"),
    supabase.from("activity_view_counts").select("activity_id, count"),
    user
      ? supabase.from("user_progress").select("activity_id, status").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { activity_id: string; status: string }[] }),
    supabase
      .from("fluency_modules")
      .select("id, title, emoji, description, concepts, sort_order, is_locked, next_module_hint, html_path")
      .eq("published", true)
      .order("sort_order"),
    supabase
      .from("activity_functions")
      .select("name, thumbnail_url, description"),
    supabase
      .from("activity_tags")
      .select("name, icon_url"),
  ]);

  const viewCounts: Record<string, number> = {};
  for (const row of viewRows ?? []) {
    viewCounts[(row as { activity_id: string; count: number }).activity_id] =
      Number((row as { activity_id: string; count: number }).count);
  }

  const completedIds = new Set(
    (progressRows ?? [])
      .filter((r: { activity_id: string; status: string }) => r.status === "completed")
      .map((r: { activity_id: string; status: string }) => r.activity_id)
  );

  const totalAvailable = (activities ?? []).length;
  const completedCount = (progressRows ?? []).filter(
    (r: { activity_id: string; status: string }) => r.status === "completed"
  ).length;

  const inProgressCount = (progressRows ?? []).filter(
    (r: { activity_id: string; status: string }) => r.status === "in_progress"
  ).length;

  const activityPoints: Record<string, number> = {};
  for (const row of activities ?? []) {
    activityPoints[row.id as string] = Number((row as { points?: number }).points ?? 0);
  }

  let userTotalPoints = sumPointsFromProgress(
    (progressRows ?? []) as { activity_id: string; status: string }[],
    activityPoints,
  );
  let companyPercentile: number | null = null;
  let companySize = 0;
  let companyAvgPoints = 0;
  let streakCount = 0;

  if (user) {
    const { data: pointsStats } = await supabase.rpc("get_my_points_stats");
    if (pointsStats && typeof pointsStats === "object") {
      const stats = pointsStats as PointsStats;
      userTotalPoints = stats.user_points ?? userTotalPoints;
      companyPercentile = stats.company_percentile ?? null;
      companySize = stats.company_size ?? 0;
      companyAvgPoints = stats.company_avg_points ?? 0;
    }

    const { data: streakProfile } = await supabase
      .from("profiles")
      .select("streak_count")
      .eq("id", user.id)
      .single();
    streakCount = streakProfile?.streak_count ?? 0;
  }

  const functionThumbnails: Record<string, string> = {};
  const functionDescriptions: Record<string, string> = {};
  for (const row of functionRows ?? []) {
    const r = row as { name: string; thumbnail_url: string | null; description: string | null };
    const key = r.name.toLowerCase();
    if (r.thumbnail_url) functionThumbnails[key] = r.thumbnail_url;
    if (r.description) functionDescriptions[key] = r.description;
  }

  return (
    <Suspense fallback={null}>
      <WorkflowsClient
        activities={(activities ?? []) as any}
        toolLogos={rowsToToolLogoMap(toolLogoRows ?? [])}
        tagLogos={rowsToTagLogoMap(tagRows ?? [])}
        viewCounts={viewCounts}
        completedIds={completedIds}
        totalAvailable={totalAvailable}
        completedCount={completedCount}
        inProgressCount={inProgressCount}
        userTotalPoints={userTotalPoints}
        companyPercentile={companyPercentile}
        companySize={companySize}
        companyAvgPoints={companyAvgPoints}
        streakCount={streakCount}
        modules={(modules ?? []) as any}
        functionThumbnails={functionThumbnails}
        functionDescriptions={functionDescriptions}
      />
    </Suspense>
  );
}

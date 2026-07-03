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
    { data: categoryRows },
    { data: tagRows },
    { data: savedWorkflowRows },
  ] = await Promise.all([
    supabase
      .from("activities")
      .select("id, title, description, tools, categories, tags, points, time_estimate_minutes, is_locked, is_featured, published, position, created_at, thumbnail_url")
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
      .from("activity_categories")
      .select("name, thumbnail_url, description"),
    supabase
      .from("activity_tags")
      .select("name, icon_url"),
    user
      ? supabase.from("user_saved_workflows").select("activity_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { activity_id: string }[] }),
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

  const inProgressIds = new Set(
    (progressRows ?? [])
      .filter((r: { activity_id: string; status: string }) => r.status === "in_progress")
      .map((r: { activity_id: string; status: string }) => r.activity_id)
  );

  const savedWorkflowIds = new Set(
    (savedWorkflowRows ?? []).map((r: { activity_id: string }) => r.activity_id)
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
  let workflowsConfirmed = false;

  if (user) {
    const { data: pointsStats } = await supabase.rpc("get_my_points_stats");
    if (pointsStats && typeof pointsStats === "object") {
      const stats = pointsStats as PointsStats;
      userTotalPoints = stats.user_points ?? userTotalPoints;
      companyPercentile = stats.company_percentile ?? null;
      companySize = stats.company_size ?? 0;
      companyAvgPoints = stats.company_avg_points ?? 0;
    }

    const { data: confirmProfile, error: confirmError } = await supabase
      .from("profiles")
      .select("workflows_confirmed_at")
      .eq("id", user.id)
      .single();
    if (!confirmError && confirmProfile) {
      workflowsConfirmed = !!confirmProfile.workflows_confirmed_at;
    }
  }

  const categoryThumbnails: Record<string, string> = {};
  const categoryDescriptions: Record<string, string> = {};
  for (const row of categoryRows ?? []) {
    const r = row as { name: string; thumbnail_url: string | null; description: string | null };
    const key = r.name.toLowerCase();
    if (r.thumbnail_url) categoryThumbnails[key] = r.thumbnail_url;
    if (r.description) categoryDescriptions[key] = r.description;
  }

  return (
    <Suspense fallback={null}>
      <WorkflowsClient
        activities={(activities ?? []) as any}
        toolLogos={rowsToToolLogoMap(toolLogoRows ?? [])}
        tagLogos={rowsToTagLogoMap(tagRows ?? [])}
        userId={user?.id ?? null}
        viewCounts={viewCounts}
        completedIds={completedIds}
        inProgressIds={inProgressIds}
        savedWorkflowIds={savedWorkflowIds}
        totalAvailable={totalAvailable}
        completedCount={completedCount}
        inProgressCount={inProgressCount}
        userTotalPoints={userTotalPoints}
        companyPercentile={companyPercentile}
        companySize={companySize}
        companyAvgPoints={companyAvgPoints}
        modules={(modules ?? []) as any}
        categoryThumbnails={categoryThumbnails}
        categoryDescriptions={categoryDescriptions}
        workflowsConfirmed={workflowsConfirmed}
      />
    </Suspense>
  );
}

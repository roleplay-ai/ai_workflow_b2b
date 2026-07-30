import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rowsToToolLogoMap } from "@/lib/toolLogos";
import WorkflowsClient, {
  type ContinueWorkflowProgress,
  type WorkflowCategoryMetadata,
} from "./WorkflowsClient";
import type { PreferredAiTool } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type ProgressRow = {
  activity_id: string;
  status: string;
  completed_steps: number[] | null;
  updated_at: string;
};

export default async function WorkflowsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: activities },
    { data: toolLogoRows },
    { data: viewRows },
    { data: progressRows },
    { data: savedWorkflowRows },
    preferenceResult,
  ] = await Promise.all([
    supabase
      .from("activities")
      .select("id, title, description, tools, categories, tags, points, time_estimate_minutes, is_locked, is_featured, published, position, created_at, thumbnail_url, content_type")
      .eq("published", true)
      .order("position"),
    supabase.from("tool_logos").select("tool, logo_url"),
    supabase.from("activity_view_counts").select("activity_id, count"),
    supabase
      .from("user_progress")
      .select("activity_id, status, completed_steps, updated_at")
      .eq("user_id", user.id),
    supabase
      .from("user_saved_workflows")
      .select("activity_id, created_at")
      .eq("user_id", user.id)
      .eq("source", "liked")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("preferred_ai_tool")
      .eq("id", user.id)
      .maybeSingle(),
  ]);
  const defaultTool = preferenceResult.error
    ? null
    : preferenceResult.data?.preferred_ai_tool as PreferredAiTool | null;

  let categoryMetadata: WorkflowCategoryMetadata[] = [];
  const categoryResult = await supabase
    .from("activity_categories")
    .select("name, description, thumbnail_url, icon, display_order, is_visible")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (!categoryResult.error) {
    categoryMetadata = (categoryResult.data ?? []) as WorkflowCategoryMetadata[];
  } else {
    // The page remains usable before the prepared display-metadata migration
    // is applied; order and icons then use deterministic code fallbacks.
    const fallbackResult = await supabase
      .from("activity_categories")
      .select("name, description, thumbnail_url")
      .order("name", { ascending: true });
    categoryMetadata = (fallbackResult.data ?? []).map((category) => ({
      ...category,
      icon: null,
      display_order: 0,
      is_visible: true,
    }));
  }

  const typedProgressRows = (progressRows ?? []) as ProgressRow[];
  const completedIds = typedProgressRows
    .filter((progress) => progress.status === "completed")
    .map((progress) => progress.activity_id);
  const inProgressIds = typedProgressRows
    .filter((progress) => progress.status === "in_progress")
    .map((progress) => progress.activity_id);

  const latestInProgress = typedProgressRows
    .filter((progress) => progress.status === "in_progress")
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .find((progress) => (activities ?? []).some((activity) => activity.id === progress.activity_id));

  let continueProgress: ContinueWorkflowProgress | null = null;
  if (latestInProgress) {
    const { count: totalSteps } = await supabase
      .from("activity_steps")
      .select("*", { count: "exact", head: true })
      .eq("activity_id", latestInProgress.activity_id);
    continueProgress = {
      activityId: latestInProgress.activity_id,
      completedSteps: latestInProgress.completed_steps?.length ?? 0,
      totalSteps: totalSteps ?? 0,
      updatedAt: latestInProgress.updated_at,
    };
  }

  const viewCounts: Record<string, number> = {};
  for (const row of viewRows ?? []) {
    viewCounts[row.activity_id as string] = Number(row.count ?? 0);
  }

  return (
    <Suspense fallback={null}>
      <WorkflowsClient
        activities={(activities ?? []) as any}
        toolLogos={rowsToToolLogoMap(toolLogoRows ?? [])}
        userId={user.id}
        viewCounts={viewCounts}
        completedIds={completedIds}
        inProgressIds={inProgressIds}
        savedWorkflowIds={(savedWorkflowRows ?? []).map((row) => row.activity_id as string)}
        categoryMetadata={categoryMetadata}
        continueProgress={continueProgress}
        defaultTool={defaultTool}
      />
    </Suspense>
  );
}

import { createClient } from "@/lib/supabase/server";
import { rowsToToolLogoMap } from "@/lib/toolLogos";
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
  ] = await Promise.all([
    supabase
      .from("activities")
      .select("id, title, description, tools, functions, time_estimate_minutes, is_locked, is_featured, published, position, created_at, thumbnail_url")
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

  const functionThumbnails: Record<string, string> = {};
  const functionDescriptions: Record<string, string> = {};
  for (const row of functionRows ?? []) {
    const r = row as { name: string; thumbnail_url: string | null; description: string | null };
    const key = r.name.toLowerCase();
    if (r.thumbnail_url) functionThumbnails[key] = r.thumbnail_url;
    if (r.description) functionDescriptions[key] = r.description;
  }

  return (
    <WorkflowsClient
      activities={(activities ?? []) as any}
      toolLogos={rowsToToolLogoMap(toolLogoRows ?? [])}
      viewCounts={viewCounts}
      completedIds={completedIds}
      totalAvailable={totalAvailable}
      completedCount={completedCount}
      inProgressCount={inProgressCount}
      modules={(modules ?? []) as any}
      functionThumbnails={functionThumbnails}
      functionDescriptions={functionDescriptions}
    />
  );
}

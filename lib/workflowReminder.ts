import type { SupabaseClient } from "@supabase/supabase-js";

export const RECENT_WORKFLOW_DAYS = 14;

export type ReminderWorkflow = { id: string; title: string; description: string | null };

/**
 * Up to `limit` workflows for a reminder email: the user's incomplete saved
 * workflows first, topped up with recently-published workflows they haven't saved.
 */
export async function getReminderWorkflows(
  supabase: SupabaseClient,
  userId: string,
  limit = 3,
): Promise<ReminderWorkflow[]> {
  const { data: saved } = await supabase
    .from("user_saved_workflows")
    .select("activity_id, activities(id, title, description)")
    .eq("user_id", userId);

  const savedIds = (saved ?? []).map((s: any) => s.activity_id);

  const { data: progress } = savedIds.length
    ? await supabase.from("user_progress").select("activity_id, status").eq("user_id", userId).in("activity_id", savedIds)
    : { data: [] as { activity_id: string; status: string }[] };

  const completedIds = new Set((progress ?? []).filter((p: any) => p.status === "completed").map((p: any) => p.activity_id));

  const incomplete: ReminderWorkflow[] = (saved ?? [])
    .filter((s: any) => !completedIds.has(s.activity_id) && s.activities)
    .map((s: any) => ({ id: s.activities.id, title: s.activities.title, description: s.activities.description }));

  const result = incomplete.slice(0, limit);
  if (result.length >= limit) return result;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECENT_WORKFLOW_DAYS);

  const { data: recent } = await supabase
    .from("activities")
    .select("id, title, description")
    .eq("published", true)
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: false });

  const savedIdSet = new Set(savedIds);
  const usedIds = new Set(result.map(r => r.id));

  for (const a of recent ?? []) {
    if (result.length >= limit) break;
    if (savedIdSet.has(a.id) || usedIds.has(a.id)) continue;
    result.push({ id: a.id, title: a.title, description: a.description });
    usedIds.add(a.id);
  }

  return result;
}

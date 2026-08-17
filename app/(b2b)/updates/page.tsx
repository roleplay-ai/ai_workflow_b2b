import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TOTAL_MODULES } from "@/lib/ai-mastery-course";
import type { WhatsNewUpdate } from "@/lib/supabase/types";
import UpdatesClient from "./UpdatesClient";

export const dynamic = "force-dynamic";

export default async function UpdatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: updates },
    { data: videos },
    { data: tools },
    { data: toolGuides },
    { data: toolLogoRows },
    { data: featuredActivities },
    { data: deepDives },
    { data: fluencyModules },
    { data: fluencyProgress },
    { data: masteryProgress },
    { data: masteryProfile },
  ] = await Promise.all([
    supabase
      .from("whats_new_updates")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false }),
    supabase
      .from("apply_videos")
      .select("id, title, description, video_url, thumbnail_url, duration, group_name, category_tag")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("order_index")
      .limit(12),
    supabase
      .from("fluency_tools")
      .select("*, fluency_tool_pros(content, sort_order), fluency_tool_cons(content, sort_order)")
      .eq("published", true)
      .order("sort_order"),
    supabase
      .from("fluency_tool_guides")
      .select("*")
      .eq("published", true)
      .order("sort_order"),
    supabase.from("tool_logos").select("tool, logo_url"),
    supabase
      .from("activities")
      .select("id, title, tools, description")
      .eq("published", true)
      .eq("is_featured", true)
      .order("position")
      .limit(8),
    supabase
      .from("tool_deep_dives")
      .select("id, title, description, tool, url, html_path, link_type")
      .eq("published", true)
      .order("position"),
    supabase
      .from("fluency_modules")
      .select("id, title, description, emoji, concepts, sort_order, is_locked, next_module_hint, html_path")
      .eq("published", true)
      .order("sort_order"),
    supabase
      .from("user_fluency_progress")
      .select("module_id")
      .eq("user_id", user.id),
    supabase
      .from("ai_mastery_progress")
      .select("module_id")
      .eq("user_id", user.id),
    supabase
      .from("profiles")
      .select("role, aimastery_approved, aimastery_requested")
      .eq("id", user.id)
      .single(),
  ]);

  const toolLogos: Record<string, string> = {};
  for (const row of toolLogoRows ?? []) {
    if (row.tool && row.logo_url) toolLogos[row.tool as string] = row.logo_url as string;
  }

  return (
    <UpdatesClient
      updates={(updates ?? []) as WhatsNewUpdate[]}
      videos={(videos ?? []) as any}
      tools={(tools ?? []) as any}
      toolGuides={(toolGuides ?? []) as any}
      toolLogos={toolLogos}
      deepDives={(deepDives ?? []) as any}
      newActivities={(featuredActivities ?? []) as any}
      fluencyModules={(fluencyModules ?? []) as any}
      completedFluencyModuleIds={(fluencyProgress ?? []).map((r: any) => r.module_id as string)}
      masteryCompletedCount={(masteryProgress ?? []).length}
      masteryCompletedModuleIds={(masteryProgress ?? []).map((r: any) => r.module_id as string)}
      masteryTotalModules={TOTAL_MODULES}
      masteryApproved={masteryProfile?.role === "superadmin" || Boolean(masteryProfile?.aimastery_approved)}
      masteryRequested={Boolean(masteryProfile?.aimastery_requested)}
    />
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { userNeedsOnboarding } from "@/lib/auth/onboardingGate";
import UpdatesClient from "./UpdatesClient";

export const dynamic = "force-dynamic";

export default async function UpdatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (await userNeedsOnboarding(supabase, user.id)) redirect("/ask-ai");

  const [
    { data: briefs },
    { data: videos },
    { data: tools },
    { data: toolGuides },
    { data: toolLogoRows },
    { data: featuredActivities },
    { data: deepDives },
  ] = await Promise.all([
    supabase
      .from("fluency_briefs")
      .select("*, fluency_brief_items(*)")
      .eq("is_active", true)
      .order("published_date", { ascending: false })
      .limit(1),
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
  ]);

  const toolLogos: Record<string, string> = {};
  for (const row of toolLogoRows ?? []) {
    if (row.tool && row.logo_url) toolLogos[row.tool as string] = row.logo_url as string;
  }

  return (
    <UpdatesClient
      brief={(briefs?.[0] ?? null) as any}
      videos={(videos ?? []) as any}
      tools={(tools ?? []) as any}
      toolGuides={(toolGuides ?? []) as any}
      toolLogos={toolLogos}
      deepDives={(deepDives ?? []) as any}
      newActivities={(featuredActivities ?? []) as any}
    />
  );
}

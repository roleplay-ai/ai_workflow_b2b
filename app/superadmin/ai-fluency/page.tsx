import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AIFluencyAdminClient from "./AIFluencyAdminClient";
export const dynamic = "force-dynamic";

export default async function AIFluencyAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, avatar_url, company_id, created_at")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "superadmin") redirect("/apply");

  const [
    { data: modules },
    { data: videos },
    { data: tools },
    { data: briefs },
  ] = await Promise.all([
    supabase
      .from("fluency_modules")
      .select("id, title, description, emoji, concepts, sort_order, is_locked, published, next_module_hint, html_path")
      .order("sort_order"),
    supabase
      .from("apply_videos")
      .select("id, title, description, video_url, thumbnail_url, duration, order_index, is_locked, is_featured, group_name, category_tag, platforms, is_published")
      .order("order_index"),
    supabase
      .from("fluency_tools")
      .select("id, name, category_label, description, icon_emoji, letter, color, company_name, try_url, best_for, pricing, is_featured, published, sort_order")
      .order("sort_order"),
    supabase
      .from("fluency_briefs")
      .select("id, title, published_date, is_active, fluency_brief_items(id, content, sort_order)")
      .order("published_date", { ascending: false })
      .limit(10),
  ]);

  return (
    <AIFluencyAdminClient
      modules={(modules ?? []) as any}
      videos={videos as any ?? []}
      tools={tools as any ?? []}
      briefs={briefs as any ?? []}
    />
  );
}

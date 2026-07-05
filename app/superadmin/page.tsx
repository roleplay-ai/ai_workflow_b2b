import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SuperadminClient from "./SuperadminClient";
import { collectToolSlugs } from "@/lib/tools";
export const dynamic = "force-dynamic";

export default async function SuperadminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, company_id, full_name, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return (
      <div style={{ padding: 40, fontFamily: "monospace" }}>
        <p>Profile error: {profileError?.message ?? "not found"}</p>
        <p>User ID: {user.id}</p>
      </div>
    );
  }

  if (profile.role !== "superadmin") redirect("/apply");

  const [
    { data: companies },
    { data: activities },
    { data: allAssignments },
    { data: tags },
    { data: toolLogoRows },
    { data: deepDives },
  ] = await Promise.all([
    supabase.from("companies").select("id, name, domain").order("name"),
    supabase.from("activities")
      .select("*, activity_content(id, video_url, slide_images, quiz), activity_steps(count)")
      .order("position"),
    supabase.from("activity_companies").select("activity_id, company_id"),
    supabase.from("activity_tags").select("id, name, icon_url").order("name"),
    supabase.from("tool_logos").select("tool").order("tool"),
    supabase.from("tool_deep_dives").select("*").order("position"),
  ]);

  const availableTools = collectToolSlugs(
    (toolLogoRows ?? []).map(row => row.tool),
    (activities ?? []).map(a => a.tools ?? []),
  );

  return (
    <SuperadminClient
      companies={companies ?? []}
      activities={activities as any ?? []}
      allAssignments={allAssignments ?? []}
      tags={tags ?? []}
      availableTools={availableTools}
      deepDives={deepDives ?? []}
    />
  );
}

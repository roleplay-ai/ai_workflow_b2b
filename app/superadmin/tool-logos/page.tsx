import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { rowsToToolLogoMap } from "@/lib/toolLogos";
import ToolLogosPageClient from "./ToolLogosPageClient";

export const dynamic = "force-dynamic";

export default async function ToolLogosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, company_id, full_name, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) redirect("/login");
  if (profile.role !== "superadmin") redirect("/apply");

  const [{ data: toolLogoRows }, { data: tags }, { data: functions }] = await Promise.all([
    supabase.from("tool_logos").select("tool, logo_url"),
    supabase.from("activity_tags").select("id, name, icon_url").order("name"),
    supabase.from("activity_functions").select("id, name, icon_url").order("name"),
  ]);

  return (
    <ToolLogosPageClient
      toolLogos={rowsToToolLogoMap(toolLogoRows ?? [])}
      tags={tags ?? []}
      functions={functions ?? []}
    />
  );
}

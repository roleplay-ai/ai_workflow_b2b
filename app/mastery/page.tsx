import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MasteryClient from "./MasteryClient";

export const dynamic = "force-dynamic";

export default async function MasteryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, aimastery_approved, aimastery_requested")
    .eq("id", user.id)
    .single();

  const hasAccess = profile?.role === "superadmin" || Boolean(profile?.aimastery_approved);
  const { data: masteryRows } = hasAccess
    ? await supabase
        .from("ai_mastery_progress")
        .select("module_id")
        .eq("user_id", user.id)
    : { data: [] as { module_id: string }[] };

  const completedModules = (masteryRows ?? []).map(r => r.module_id as string);

  return (
    <MasteryClient
      completedModules={completedModules}
      userName={profile?.full_name ?? null}
      hasAccess={hasAccess}
      accessRequested={Boolean(profile?.aimastery_requested)}
    />
  );
}

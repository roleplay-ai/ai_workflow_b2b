import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { WhatsNewUpdate } from "@/lib/supabase/types";
import WhatsNewAdminClient from "./WhatsNewAdminClient";

export const dynamic = "force-dynamic";

export default async function WhatsNewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "superadmin") redirect("/apply");

  const { data, error } = await supabase
    .from("whats_new_updates")
    .select("*")
    .order("published_at", { ascending: false });

  return (
    <WhatsNewAdminClient
      initialUpdates={error ? [] : data as WhatsNewUpdate[]}
      userId={user.id}
      migrationReady={!error}
    />
  );
}

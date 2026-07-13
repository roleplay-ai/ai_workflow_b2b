import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SupportRequestsClient from "./SupportRequestsClient";

export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 300;

export default async function SupportRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profileError || !profile) redirect("/login");
  if (profile.role !== "superadmin") redirect("/apply");

  // Disambiguate the profiles embed: both user_id and resolved_by FK to profiles,
  // so a bare `profiles(...)` select fails and returns no rows.
  const { data: rows, error } = await supabase
    .from("support_requests")
    .select("id, question, context, reply_to_email, status, created_at, resolved_at, user_id, profiles!user_id(full_name, email)")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    console.error("[support-requests] list failed:", error.message);
  }

  return <SupportRequestsClient requests={(rows ?? []) as any} />;
}

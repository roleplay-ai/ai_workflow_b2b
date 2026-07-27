import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fetchSupportRequests } from "@/lib/supportRequests";
import AccessRequestsClient from "./AccessRequestsClient";

export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 300;

export default async function AccessRequestsPage() {
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

  const { rows, typeFilterApplied } = await fetchSupportRequests(supabase, "access_request", HISTORY_LIMIT);

  return <AccessRequestsClient requests={rows} typeFilterApplied={typeFilterApplied} />;
}

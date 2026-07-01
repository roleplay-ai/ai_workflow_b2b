import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AIMasteryAccessClient from "./AIMasteryAccessClient";

export const dynamic = "force-dynamic";

export default async function AIMasteryAccessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, avatar_url, company_id, created_at")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin") redirect("/apply");

  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, aimastery_approved, aimastery_requested, created_at")
    .eq("aimastery_requested", true)
    .order("created_at", { ascending: false });

  return <AIMasteryAccessClient users={users ?? []} />;
}

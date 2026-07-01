import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import KnowAnalyticsClient from "./KnowAnalyticsClient";
export const dynamic = "force-dynamic";

export default async function KnowAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "superadmin") redirect("/apply");

  return <KnowAnalyticsClient />;
}

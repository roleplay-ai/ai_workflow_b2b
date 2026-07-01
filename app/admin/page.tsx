import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role, company_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "superadmin"].includes(profile.role) || !profile.company_id) {
    redirect("/apply");
  }

  const [
    { data: companyUsers },
    { count: totalActivities },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false }),
    supabase.from("activities").select("*", { count: "exact", head: true }).eq("published", true),
  ]);

  const userIds = (companyUsers ?? []).map(u => u.id);

  const [
    { data: allProgress },
    { data: activityViews },
    { data: fluencyViews },
  ] = await Promise.all([
    userIds.length
      ? supabase.from("user_progress").select("*, activities(title, points)").in("user_id", userIds)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase.from("activity_views").select("id, activity_id, user_id, created_at").in("user_id", userIds).order("created_at", { ascending: false }).limit(10000)
      : Promise.resolve({ data: [] }),
    userIds.length
      ? supabase.from("fluency_views").select("id, entity_type, entity_id, user_id, created_at").in("user_id", userIds).order("created_at", { ascending: false }).limit(10000)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <AdminDashboardClient
      companyUsers={companyUsers ?? []}
      allProgress={allProgress ?? []}
      totalActivities={totalActivities ?? 0}
      activityViews={activityViews ?? []}
      fluencyViews={fluencyViews ?? []}
    />
  );
}

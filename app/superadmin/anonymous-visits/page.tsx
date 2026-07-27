import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnonymousVisitsClient from "./AnonymousVisitsClient";

export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 300;

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42P01" || error.message?.includes("anonymous_visits") === true;
}

export default async function AnonymousVisitsPage() {
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

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [rowsResult, totalResult, dayResult, weekResult] = await Promise.all([
    supabase
      .from("anonymous_visits")
      .select("id, ip_address, user_agent, path, created_at")
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT),
    supabase.from("anonymous_visits").select("*", { count: "exact", head: true }),
    supabase.from("anonymous_visits").select("*", { count: "exact", head: true }).gte("created_at", dayAgo),
    supabase.from("anonymous_visits").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
  ]);

  const migrationMissing = isMissingTable(rowsResult.error);

  return (
    <AnonymousVisitsClient
      visits={migrationMissing ? [] : (rowsResult.data ?? [])}
      totalCount={migrationMissing ? 0 : (totalResult.count ?? 0)}
      last24hCount={migrationMissing ? 0 : (dayResult.count ?? 0)}
      last7dCount={migrationMissing ? 0 : (weekResult.count ?? 0)}
      migrationMissing={migrationMissing}
    />
  );
}

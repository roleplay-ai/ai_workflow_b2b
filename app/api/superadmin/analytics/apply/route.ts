import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  // realOnly = exclude seeded rows (which have ip_address = NULL)
  const realOnly = searchParams.get("realOnly") === "true";

  const { data: activities } = await supabase
    .from("activities")
    .select("id, title, content_type, published")
    .order("position");

  let viewsQuery = supabase
    .from("activity_views")
    .select("id, activity_id, user_id, session_id, ip_address, created_at")
    .order("created_at", { ascending: false })
    .limit(50000);

  if (from) viewsQuery = viewsQuery.gte("created_at", from);
  if (to) viewsQuery = viewsQuery.lte("created_at", to + "T23:59:59Z");
  if (realOnly) viewsQuery = viewsQuery.not("ip_address", "is", null);

  const { data: views } = await viewsQuery;

  let progressQuery = supabase
    .from("user_progress")
    .select("id, user_id, activity_id, status, quiz_score, completed_at, updated_at");

  if (from) progressQuery = progressQuery.gte("updated_at", from);
  if (to) progressQuery = progressQuery.lte("updated_at", to + "T23:59:59Z");

  const { data: progress } = await progressQuery;

  const userIds = [...new Set([
    ...(views ?? []).map(v => v.user_id).filter(Boolean),
    ...(progress ?? []).map(p => p.user_id).filter(Boolean),
  ])];

  let profiles: { id: string; email: string | null; full_name: string | null }[] = [];
  if (userIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds as string[]);
    profiles = data ?? [];
  }

  return NextResponse.json({
    activities: activities ?? [],
    views: views ?? [],
    progress: progress ?? [],
    profiles,
  });
}

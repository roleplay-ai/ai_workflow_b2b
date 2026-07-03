import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "superadmin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!profile.company_id) {
    return NextResponse.json({ error: "No company assigned" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const cat = searchParams.get("category");

  const { data: companyUsers } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("company_id", profile.company_id);

  const userIds = (companyUsers ?? []).map(u => u.id);
  if (userIds.length === 0) {
    return NextResponse.json({
      users: [], views: [], progress: [], activities: [],
      fluencyViews: [], categories: [],
    });
  }

  const { data: companyAssignments } = await supabase
    .from("activity_companies")
    .select("activity_id")
    .eq("company_id", profile.company_id);

  const assignedIds = (companyAssignments ?? []).map(a => a.activity_id);

  let activitiesQuery = supabase
    .from("activities")
    .select("id, title, content_type, categories, tools, published")
    .eq("published", true);

  if (assignedIds.length > 0) {
    activitiesQuery = activitiesQuery.in("id", assignedIds);
  }

  const { data: activities } = await activitiesQuery;

  const companyCategories = new Set<string>();
  (activities ?? []).forEach(a => {
    (a.categories ?? []).forEach((c: string) => companyCategories.add(c));
  });

  let filteredActivityIds: string[] | null = null;
  if (cat && activities) {
    filteredActivityIds = activities
      .filter(a => (a.categories ?? []).includes(cat))
      .map(a => a.id);
  }

  let viewsQuery = supabase
    .from("activity_views")
    .select("id, activity_id, user_id, created_at")
    .in("user_id", userIds)
    .order("created_at", { ascending: false })
    .limit(50000);

  if (from) viewsQuery = viewsQuery.gte("created_at", from);
  if (to) viewsQuery = viewsQuery.lte("created_at", to + "T23:59:59Z");
  if (filteredActivityIds) viewsQuery = viewsQuery.in("activity_id", filteredActivityIds);

  const { data: views } = await viewsQuery;

  let progressQuery = supabase
    .from("user_progress")
    .select("id, user_id, activity_id, status, quiz_score, completed_at, updated_at, completed_steps")
    .in("user_id", userIds);

  if (from) progressQuery = progressQuery.gte("updated_at", from);
  if (to) progressQuery = progressQuery.lte("updated_at", to + "T23:59:59Z");
  if (filteredActivityIds) progressQuery = progressQuery.in("activity_id", filteredActivityIds);

  const { data: progress } = await progressQuery;

  let fluencyViewsQuery = supabase
    .from("fluency_views")
    .select("id, entity_type, entity_id, user_id, created_at")
    .in("user_id", userIds)
    .order("created_at", { ascending: false })
    .limit(50000);

  if (from) fluencyViewsQuery = fluencyViewsQuery.gte("created_at", from);
  if (to) fluencyViewsQuery = fluencyViewsQuery.lte("created_at", to + "T23:59:59Z");

  const { data: fluencyViews } = await fluencyViewsQuery;

  return NextResponse.json({
    users: companyUsers ?? [],
    views: views ?? [],
    progress: progress ?? [],
    activities: activities ?? [],
    fluencyViews: fluencyViews ?? [],
    categories: Array.from(companyCategories).sort(),
  });
}

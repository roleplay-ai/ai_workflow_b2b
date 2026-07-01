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

  const [
    { data: modules },
    { data: videos },
    { data: deepDives },
    { data: tools },
  ] = await Promise.all([
    supabase.from("fluency_modules").select("id, title, emoji, published"),
    supabase.from("apply_videos").select("id, title, is_published"),
    supabase.from("tool_deep_dives").select("id, title, published"),
    supabase.from("fluency_tools").select("id, name"),
  ]);

  let viewsQuery = supabase
    .from("fluency_views")
    .select("id, entity_type, entity_id, user_id, session_id, ip_address, created_at")
    .order("created_at", { ascending: false })
    .limit(50000);

  if (from) viewsQuery = viewsQuery.gte("created_at", from);
  if (to) viewsQuery = viewsQuery.lte("created_at", to + "T23:59:59Z");
  if (realOnly) viewsQuery = viewsQuery.not("ip_address", "is", null);

  const { data: views } = await viewsQuery;

  const userIds = [...new Set(
    (views ?? []).map(v => v.user_id).filter(Boolean)
  )];

  let profiles: { id: string; email: string | null; full_name: string | null }[] = [];
  if (userIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", userIds as string[]);
    profiles = data ?? [];
  }

  return NextResponse.json({
    modules: modules ?? [],
    videos: videos ?? [],
    deepDives: deepDives ?? [],
    tools: tools ?? [],
    views: views ?? [],
    profiles,
  });
}

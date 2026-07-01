import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getAdminProfile(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, company_id")
    .eq("id", user.id)
    .single();
  if (!profile || !["admin", "superadmin"].includes(profile.role) || !profile.company_id) return null;
  return profile;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const profile = await getAdminProfile(supabase);
  if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase();

  let query = supabase
    .from("profiles")
    .select("id, email, full_name, role, company_id, created_at, avatar_url")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: false });

  const { data: users } = await query;

  let filtered = users ?? [];
  if (search) {
    filtered = filtered.filter((u: any) =>
      (u.full_name?.toLowerCase().includes(search)) ||
      (u.email?.toLowerCase().includes(search))
    );
  }

  const userIds = filtered.map((u: any) => u.id);
  const { data: progress } = userIds.length
    ? await supabase.from("user_progress").select("user_id, status, completed_at, updated_at").in("user_id", userIds)
    : { data: [] };

  const progressMap: Record<string, { completed: number; inProgress: number; lastActive: string | null }> = {};
  (progress ?? []).forEach((p: any) => {
    if (!progressMap[p.user_id]) progressMap[p.user_id] = { completed: 0, inProgress: 0, lastActive: null };
    if (p.status === "completed") progressMap[p.user_id].completed++;
    if (p.status === "in_progress") progressMap[p.user_id].inProgress++;
    const d = p.completed_at || p.updated_at;
    if (d && (!progressMap[p.user_id].lastActive || d > progressMap[p.user_id].lastActive!)) {
      progressMap[p.user_id].lastActive = d;
    }
  });

  const enriched = filtered.map((u: any) => ({
    ...u,
    ...(progressMap[u.id] || { completed: 0, inProgress: 0, lastActive: null }),
  }));

  return NextResponse.json({ users: enriched });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const profile = await getAdminProfile(supabase);
  if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { userId, action, data } = body as {
    userId: string;
    action: "update" | "deactivate" | "reactivate" | "change-role";
    data?: any;
  };

  const { data: target } = await supabase
    .from("profiles")
    .select("id, company_id, role")
    .eq("id", userId)
    .single();

  if (!target || target.company_id !== profile.company_id) {
    return NextResponse.json({ error: "User not found in your company" }, { status: 404 });
  }

  if (target.role === "superadmin" && profile.role !== "superadmin") {
    return NextResponse.json({ error: "Cannot modify superadmin users" }, { status: 403 });
  }

  switch (action) {
    case "update": {
      const updates: Record<string, any> = {};
      if (data?.full_name !== undefined) updates.full_name = data.full_name;
      if (data?.email !== undefined) updates.email = data.email;
      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
      }
      const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "change-role": {
      const newRole = data?.role;
      const allowedRoles = profile.role === "superadmin" ? ["user", "admin", "superadmin"] : ["user", "admin"];
      if (!newRole || !allowedRoles.includes(newRole)) {
        return NextResponse.json({ error: `Invalid role — you can assign: ${allowedRoles.join(", ")}` }, { status: 400 });
      }
      if (userId === profile.id) {
        return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
      }
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "deactivate": {
      if (userId === profile.id) {
        return NextResponse.json({ error: "Cannot deactivate yourself" }, { status: 400 });
      }
      const { error } = await supabase.from("profiles").update({ company_id: null }).eq("id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "reactivate": {
      const { error } = await supabase.from("profiles").update({ company_id: profile.company_id }).eq("id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

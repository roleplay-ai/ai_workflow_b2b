import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
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

  const { users } = await req.json() as { users: { email: string; full_name?: string }[] };

  if (!Array.isArray(users) || users.length === 0) {
    return NextResponse.json({ error: "No users provided" }, { status: 400 });
  }

  if (users.length > 500) {
    return NextResponse.json({ error: "Maximum 500 users per batch" }, { status: 400 });
  }

  const results: { email: string; status: "created" | "exists" | "error"; message?: string }[] = [];

  for (const u of users) {
    const email = u.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      results.push({ email: u.email ?? "", status: "error", message: "Invalid email" });
      continue;
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      results.push({ email, status: "exists", message: "User already exists" });
      continue;
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: u.full_name ?? null },
    });

    if (authError) {
      results.push({ email, status: "error", message: authError.message });
      continue;
    }

    if (authUser?.user) {
      await supabase.from("profiles").update({
        company_id: profile.company_id,
        full_name: u.full_name ?? null,
      }).eq("id", authUser.user.id);
    }

    results.push({ email, status: "created" });
  }

  const created = results.filter(r => r.status === "created").length;
  const existed = results.filter(r => r.status === "exists").length;
  const errors = results.filter(r => r.status === "error").length;

  return NextResponse.json({ results, summary: { created, existed, errors, total: users.length } });
}

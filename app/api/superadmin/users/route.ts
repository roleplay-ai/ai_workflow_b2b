import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

async function requireSuperadmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "superadmin") return null;
  return profile;
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const admin = await requireSuperadmin(supabase);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase();
  const companyId = searchParams.get("company_id");
  const role = searchParams.get("role");

  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, company_id, created_at, avatar_url")
    .order("created_at", { ascending: false });

  let filtered = users ?? [];

  if (search) {
    filtered = filtered.filter((u: any) =>
      (u.full_name?.toLowerCase().includes(search)) ||
      (u.email?.toLowerCase().includes(search))
    );
  }
  if (companyId) {
    filtered = filtered.filter((u: any) => u.company_id === companyId);
  }
  if (role && role !== "all") {
    filtered = filtered.filter((u: any) => u.role === role);
  }

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name")
    .order("name");

  const companyMap: Record<string, string> = {};
  (companies ?? []).forEach((c: any) => { companyMap[c.id] = c.name; });

  const enriched = filtered.map((u: any) => ({
    ...u,
    company_name: u.company_id ? (companyMap[u.company_id] ?? "Unknown") : null,
  }));

  return NextResponse.json({ users: enriched, companies: companies ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const admin = await requireSuperadmin(supabase);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as {
    full_name?: string;
    email?: string;
    password?: string;
    company_id?: string;
    role?: string;
  };

  const full_name = String(body.full_name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const company_id = body.company_id?.trim() || null;
  const role = body.role && ["user", "admin", "superadmin"].includes(body.role) ? body.role : "user";

  if (!full_name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  if (!company_id) {
    return NextResponse.json({ error: "Company is required" }, { status: 400 });
  }

  const { data: company, error: companyErr } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", company_id)
    .maybeSingle();

  if (companyErr || !company) {
    return NextResponse.json({ error: "Company not found" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  let service;
  try {
    service = createServiceClient();
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server misconfigured" }, { status: 500 });
  }

  const { data: authUser, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (authError || !authUser?.user) {
    return NextResponse.json(
      { error: authError?.message || "Failed to create auth user" },
      { status: 500 }
    );
  }

  const { error: profileErr } = await service
    .from("profiles")
    .update({
      email,
      full_name,
      company_id,
      role,
      initial_password: password,
    })
    .eq("id", authUser.user.id);

  if (profileErr) {
    return NextResponse.json(
      { error: `User created but profile update failed: ${profileErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: authUser.user.id,
      email,
      full_name,
      company_id,
      company_name: company.name,
      role,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const admin = await requireSuperadmin(supabase);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, action, data } = await req.json() as {
    userId: string;
    action: "update" | "change-role" | "assign-company" | "deactivate";
    data?: any;
  };

  if (userId === admin.id && action === "change-role") {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
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
      if (!newRole || !["user", "admin", "superadmin"].includes(newRole)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "assign-company": {
      const companyId = data?.company_id ?? null;
      const { error } = await supabase.from("profiles").update({ company_id: companyId }).eq("id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "deactivate": {
      const { error } = await supabase.from("profiles").update({ company_id: null, role: "user" }).eq("id", userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

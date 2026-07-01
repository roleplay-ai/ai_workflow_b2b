import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

export async function GET() {
  const supabase = await createClient();
  const admin = await requireSuperadmin(supabase);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, domain, created_at")
    .order("name");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("company_id");

  const userCounts: Record<string, number> = {};
  (profiles ?? []).forEach((p: any) => {
    if (p.company_id) userCounts[p.company_id] = (userCounts[p.company_id] || 0) + 1;
  });

  const enriched = (companies ?? []).map((c: any) => ({
    ...c,
    user_count: userCounts[c.id] || 0,
  }));

  return NextResponse.json({ companies: enriched });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const admin = await requireSuperadmin(supabase);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, domain } = await req.json() as { name: string; domain?: string };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Company name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({ name: name.trim(), domain: domain?.trim() || null, created_by: admin.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ company: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const admin = await requireSuperadmin(supabase);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { companyId, name, domain } = await req.json() as { companyId: string; name?: string; domain?: string };

  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name.trim();
  if (domain !== undefined) updates.domain = domain.trim() || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase.from("companies").update(updates).eq("id", companyId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const admin = await requireSuperadmin(supabase);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { companyId } = await req.json() as { companyId: string };

  await supabase.from("profiles").update({ company_id: null }).eq("company_id", companyId);
  await supabase.from("activity_companies").delete().eq("company_id", companyId);

  const { error } = await supabase.from("companies").delete().eq("id", companyId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

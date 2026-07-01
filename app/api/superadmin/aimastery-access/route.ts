import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// PATCH /api/superadmin/aimastery-access  { userId, approved: boolean }
export async function PATCH(req: Request) {
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

  const { userId, approved } = await req.json();
  if (!userId || typeof approved !== "boolean") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ aimastery_approved: approved })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

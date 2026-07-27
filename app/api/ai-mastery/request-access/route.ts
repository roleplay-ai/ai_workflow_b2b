import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, aimastery_approved, aimastery_requested")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: profileError?.message ?? "Profile unavailable" }, { status: 500 });
  }

  if (profile.role === "superadmin" || profile.aimastery_approved) {
    return NextResponse.json({ requested: true, approved: true });
  }

  if (!profile.aimastery_requested) {
    const { error } = await supabase
      .from("profiles")
      .update({ aimastery_requested: true })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ requested: true, approved: false });
}

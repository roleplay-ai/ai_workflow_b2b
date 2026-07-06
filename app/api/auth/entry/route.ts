import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getB2BEntryPath } from "@/lib/auth/onboardingGate";
import type { Role } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile?.role ?? "user") as Role;
  const redirect = request.nextUrl.searchParams.get("redirect");
  const path = await getB2BEntryPath(supabase, user.id, role, redirect);

  return NextResponse.redirect(new URL(path, request.url));
}

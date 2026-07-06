import { createClient } from "@/lib/supabase/server";
import { getB2BEntryPath } from "@/lib/auth/onboardingGate";
import type { Role } from "@/lib/supabase/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const next = searchParams.get("next");
      let requestedPath: string | null = null;
      if (next) {
        try {
          const url = new URL(next, origin);
          if (url.origin === origin) requestedPath = url.pathname + url.search;
        } catch { /* ignore */ }
      }

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = user
        ? await supabase.from("profiles").select("role").eq("id", user.id).single()
        : { data: null };

      const role = (profile?.role ?? "user") as Role;
      const destination = user
        ? await getB2BEntryPath(supabase, user.id, role, requestedPath)
        : "/workflows";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

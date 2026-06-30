import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const next = searchParams.get("next");
      let destination = "/workflows";
      if (next) {
        try {
          const url = new URL(next, origin);
          if (url.origin === origin) destination = url.pathname + url.search;
        } catch { /* ignore */ }
      }
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

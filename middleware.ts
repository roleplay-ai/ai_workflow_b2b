import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const path = request.nextUrl.pathname;

  const { data: { user } } = await supabase.auth.getUser();

  if (path.startsWith("/api/") || path.startsWith("/auth/")) return supabaseResponse;
  if (path.startsWith("/login") || path.startsWith("/signup")) return supabaseResponse;

  const isAdminPath = path.startsWith("/admin") || path.startsWith("/superadmin");

  if (!user) {
    if (isAdminPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // No account required to browse the app — give anonymous visitors a real
    // (is_anonymous) Supabase session so every existing auth.uid()-scoped RLS
    // policy and page-level `if (!user) redirect("/login")` check keeps working
    // unmodified. Ask AI then caps *these* sessions at a handful of free questions.
    const { error: anonSignInError } = await supabase.auth.signInAnonymously();
    if (anonSignInError) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  if (isAdminPath && user.is_anonymous) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon(?:\\.png)?|apple-icon(?:\\.png)?|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

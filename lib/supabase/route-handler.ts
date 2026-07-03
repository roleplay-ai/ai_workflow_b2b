import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/** Supabase client for Route Handlers — reads request cookies and can refresh the session. */
export function createRouteHandlerClient(request: NextRequest) {
  let sessionResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          sessionResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            sessionResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, sessionResponse };
}

/** Attach any session cookies refreshed during getUser() to a JSON response. */
export function jsonWithSessionCookies(
  sessionResponse: NextResponse,
  body: unknown,
  init?: ResponseInit,
) {
  const res = NextResponse.json(body, init);
  sessionResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
    res.cookies.set(name, value, options);
  });
  return res;
}

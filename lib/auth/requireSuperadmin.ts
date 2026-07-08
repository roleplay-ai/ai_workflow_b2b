import type { SupabaseClient } from "@supabase/supabase-js";

export type SuperadminCheck =
  | { ok: true; userId: string }
  | { ok: false; error: string; status: 401 | 403 };

/** Shared guard for the knowledge-base API routes — all of them require a superadmin session. */
export async function requireSuperadmin(supabase: SupabaseClient): Promise<SuperadminCheck> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized", status: 401 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "superadmin") {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  return { ok: true, userId: user.id };
}

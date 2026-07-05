import type { SupabaseClient } from "@supabase/supabase-js";
import { getPostLoginPath } from "@/lib/auth/postLogin";
import type { Role } from "@/lib/supabase/types";

/** True when the user must complete onboarding (never finished, or no saved workflows yet). */
export async function userNeedsOnboarding(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const [{ data: profile, error: profileError }, { count, error: countError }] = await Promise.all([
    supabase.from("profiles").select("onboarding_completed_at").eq("id", userId).maybeSingle(),
    supabase
      .from("user_saved_workflows")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  // Fail open if we can't read profile or saved workflows.
  if (profileError && countError) return false;

  if (!profileError && profile && !profile.onboarding_completed_at) return true;

  if (!countError && (count ?? 0) === 0) return true;

  return false;
}

/** Post-login destination for B2B learners — onboarding first when preferences/workflows are missing. */
export async function getB2BEntryPath(
  supabase: SupabaseClient,
  userId: string,
  role: Role,
  requestedPath?: string | null,
): Promise<string> {
  if (role === "superadmin" || role === "admin") {
    return getPostLoginPath(role, requestedPath);
  }

  if (await userNeedsOnboarding(supabase, userId)) {
    return "/onboarding";
  }

  return getPostLoginPath(role, requestedPath);
}

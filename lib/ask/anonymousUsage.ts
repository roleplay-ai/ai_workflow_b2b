import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/admin";

export function isMissingIpColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST204" || error.message?.includes("ip_address") === true;
}

/** The anonymous free-chat cap is keyed by IP (via the service-role client, so it can
 *  see every anonymous session's messages, not just the current one's own rows) —
 *  otherwise clearing cookies for a fresh anonymous session resets the counter. Falls
 *  back to the old per-session count if the ip_address column's migration hasn't been
 *  applied yet, or if the IP genuinely can't be determined. */
export async function countAnonymousMessagesToday(
  ownClient: SupabaseClient,
  userId: string,
  ipAddress: string | null,
  sinceIso: string,
): Promise<number> {
  if (ipAddress) {
    const { count, error } = await createServiceClient()
      .from("kb_chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ipAddress)
      .eq("role", "user")
      .gte("created_at", sinceIso);
    if (!error) return count ?? 0;
    if (!isMissingIpColumn(error)) return count ?? 0;
  }

  const { count } = await ownClient
    .from("kb_chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", sinceIso);
  return count ?? 0;
}

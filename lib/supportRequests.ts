import type { SupabaseClient } from "@supabase/supabase-js";

export type SupportRequestType = "unanswered_question" | "access_request";

export type SupportRequestRow = {
  id: string;
  question: string;
  context: string | null;
  reply_to_email: string;
  status: "open" | "resolved";
  created_at: string;
  resolved_at: string | null;
  user_id: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

const COLUMNS = "id, question, context, reply_to_email, status, created_at, resolved_at, user_id, profiles!user_id(full_name, email)";

function isMissingRequestTypeColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42703" || error.code === "PGRST204" || error.message?.includes("request_type") === true;
}

/** Ask our team (unanswered questions) and Contact us (access requests) share the
 *  `support_requests` table, distinguished by `request_type`. Falls back to the
 *  unfiltered list if that column's migration hasn't been applied yet, rather than
 *  erroring, so requests still show up somewhere in the meantime. */
export async function fetchSupportRequests(
  supabase: SupabaseClient,
  requestType: SupportRequestType,
  limit: number,
): Promise<{ rows: SupportRequestRow[]; typeFilterApplied: boolean }> {
  const filtered = await supabase
    .from("support_requests")
    .select(COLUMNS)
    .eq("request_type", requestType)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!filtered.error) {
    return { rows: (filtered.data ?? []) as unknown as SupportRequestRow[], typeFilterApplied: true };
  }

  if (!isMissingRequestTypeColumn(filtered.error)) {
    console.error(`[support-requests:${requestType}] list failed:`, filtered.error.message);
    return { rows: [], typeFilterApplied: true };
  }

  const unfiltered = await supabase
    .from("support_requests")
    .select(COLUMNS)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unfiltered.error) {
    console.error(`[support-requests:${requestType}] fallback list failed:`, unfiltered.error.message);
    return { rows: [], typeFilterApplied: false };
  }

  return { rows: (unfiltered.data ?? []) as unknown as SupportRequestRow[], typeFilterApplied: false };
}

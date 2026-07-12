import { NextRequest } from "next/server";
import { createRouteHandlerClient, jsonWithSessionCookies } from "@/lib/supabase/route-handler";
import { ASK_LIMITS, isValidEmail, validateSessionId, validateSupportRequest } from "@/lib/ask/guardrails";

export async function POST(req: NextRequest) {
  const { supabase, sessionResponse } = createRouteHandlerClient(req);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonWithSessionCookies(sessionResponse, { error: "Unauthorized" }, { status: 401 });

  const replyToEmail = user.email ?? "";
  if (!isValidEmail(replyToEmail)) {
    return jsonWithSessionCookies(sessionResponse, { error: "Your account has no valid email on file" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    question?: string;
    context?: string;
    sessionId?: string;
  };

  const result = validateSupportRequest(body);
  if (!result.ok) {
    return jsonWithSessionCookies(sessionResponse, { error: result.error }, { status: result.status });
  }

  const sessionId = body.sessionId != null && validateSessionId(body.sessionId) ? body.sessionId : null;

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: dailyCount } = await supabase
    .from("support_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", dayAgo);

  if ((dailyCount ?? 0) >= ASK_LIMITS.dailySupportRequests) {
    return jsonWithSessionCookies(
      sessionResponse,
      { error: "Daily limit reached for sending questions to our team. Try again tomorrow." },
      { status: 429 },
    );
  }

  const { error: insertErr } = await supabase.from("support_requests").insert({
    user_id: user.id,
    session_id: sessionId,
    question: result.question,
    context: result.context ?? null,
    reply_to_email: replyToEmail,
  });

  if (insertErr) {
    return jsonWithSessionCookies(sessionResponse, { error: insertErr.message }, { status: 500 });
  }

  return jsonWithSessionCookies(sessionResponse, { ok: true });
}

import { NextRequest } from "next/server";
import { createRouteHandlerClient, jsonWithSessionCookies } from "@/lib/supabase/route-handler";
import { ASK_LIMITS, isValidEmail, validateSessionId, validateSupportRequest } from "@/lib/ask/guardrails";

function isMissingRequestTypeColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST204" || error.message?.includes("request_type") === true;
}

export async function POST(req: NextRequest) {
  const { supabase, sessionResponse } = createRouteHandlerClient(req);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonWithSessionCookies(sessionResponse, { error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    question?: string;
    context?: string;
    sessionId?: string;
    email?: string;
    requestType?: string;
  };

  const requestType = body.requestType === "access_request" ? "access_request" : "unanswered_question";

  // Real accounts always reply-to their verified account email — never a client-supplied
  // one. Anonymous visitors have no account email at all, so (and only so) that's the one
  // case where we accept an email typed into the dialog itself.
  const replyToEmail = user.is_anonymous ? (typeof body.email === "string" ? body.email.trim() : "") : (user.email ?? "");
  if (!isValidEmail(replyToEmail)) {
    return jsonWithSessionCookies(
      sessionResponse,
      { error: user.is_anonymous ? "Enter a valid email so our team can reply." : "Your account has no valid email on file" },
      { status: 400 },
    );
  }

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

  const baseInsert = {
    user_id: user.id,
    session_id: sessionId,
    question: result.question,
    context: result.context ?? null,
    reply_to_email: replyToEmail,
  };

  const { error: insertErr } = await supabase.from("support_requests").insert({ ...baseInsert, request_type: requestType });

  // Backward compatibility for deployments where the request_type migration hasn't
  // been applied yet — still record the request, just without the type distinction.
  if (insertErr && isMissingRequestTypeColumn(insertErr)) {
    const { error: fallbackErr } = await supabase.from("support_requests").insert(baseInsert);
    if (fallbackErr) {
      return jsonWithSessionCookies(sessionResponse, { error: fallbackErr.message }, { status: 500 });
    }
  } else if (insertErr) {
    return jsonWithSessionCookies(sessionResponse, { error: insertErr.message }, { status: 500 });
  }

  return jsonWithSessionCookies(sessionResponse, { ok: true });
}

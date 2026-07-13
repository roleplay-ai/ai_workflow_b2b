import { NextRequest } from "next/server";
import { createRouteHandlerClient, jsonWithSessionCookies } from "@/lib/supabase/route-handler";

export async function POST(req: NextRequest) {
  const { supabase, sessionResponse } = createRouteHandlerClient(req);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return jsonWithSessionCookies(sessionResponse, { error: "Unauthorized" }, { status: 401 });
  }

  const { activityId } = await req.json() as { activityId?: string };
  if (!activityId) {
    return jsonWithSessionCookies(sessionResponse, { error: "Missing activityId" }, { status: 400 });
  }

  const { data: existing, error: lookupError } = await supabase
    .from("user_saved_workflows")
    .select("id")
    .eq("user_id", user.id)
    .eq("activity_id", activityId)
    .maybeSingle();

  if (lookupError) {
    return jsonWithSessionCookies(sessionResponse, { error: lookupError.message }, { status: 500 });
  }

  if (existing) {
    const { error } = await supabase
      .from("user_saved_workflows")
      .delete()
      .eq("user_id", user.id)
      .eq("activity_id", activityId);

    if (error) return jsonWithSessionCookies(sessionResponse, { error: error.message }, { status: 500 });
    return jsonWithSessionCookies(sessionResponse, { saved: false });
  }

  const { error } = await supabase
    .from("user_saved_workflows")
    .insert({ user_id: user.id, activity_id: activityId, source: "liked" });

  if (error) {
    // Unique race: another request already saved it — treat as saved.
    if (error.code === "23505") {
      return jsonWithSessionCookies(sessionResponse, { saved: true });
    }
    return jsonWithSessionCookies(sessionResponse, { error: error.message }, { status: 500 });
  }

  return jsonWithSessionCookies(sessionResponse, { saved: true });
}

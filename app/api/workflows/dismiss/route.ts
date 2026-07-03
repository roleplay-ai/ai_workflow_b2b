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

  const { error } = await supabase
    .from("user_saved_workflows")
    .delete()
    .eq("user_id", user.id)
    .eq("activity_id", activityId);

  if (error) return jsonWithSessionCookies(sessionResponse, { error: error.message }, { status: 500 });

  return jsonWithSessionCookies(sessionResponse, { ok: true });
}

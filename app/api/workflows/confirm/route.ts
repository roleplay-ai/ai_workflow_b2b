import { NextRequest } from "next/server";
import { createRouteHandlerClient, jsonWithSessionCookies } from "@/lib/supabase/route-handler";

export async function POST(req: NextRequest) {
  const { supabase, sessionResponse } = createRouteHandlerClient(req);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return jsonWithSessionCookies(sessionResponse, { error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ workflows_confirmed_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return jsonWithSessionCookies(sessionResponse, { error: error.message }, { status: 500 });

  return jsonWithSessionCookies(sessionResponse, { ok: true });
}

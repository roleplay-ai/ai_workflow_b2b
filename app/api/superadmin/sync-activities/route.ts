import { NextRequest } from "next/server";
import { createRouteHandlerClient, jsonWithSessionCookies } from "@/lib/supabase/route-handler";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { embedBatch } from "@/lib/embeddings";

/**
 * (Re)computes embeddings for every published activity, so Ask AI can suggest relevant
 * workflows. Triggered manually from the superadmin Activities page — activities are
 * edited from several places, so an on-demand sync is simpler and more robust than
 * hooking every save path.
 */
export async function POST(req: NextRequest) {
  const { supabase, sessionResponse } = createRouteHandlerClient(req);
  const auth = await requireSuperadmin(supabase);
  if (!auth.ok) return jsonWithSessionCookies(sessionResponse, { error: auth.error }, { status: auth.status });

  const { data: activities, error } = await supabase
    .from("activities")
    .select("id, title, description, tools, categories, functions")
    .eq("published", true);

  if (error) return jsonWithSessionCookies(sessionResponse, { error: error.message }, { status: 500 });
  if (!activities || activities.length === 0) {
    return jsonWithSessionCookies(sessionResponse, { synced: 0 });
  }

  const texts = activities.map((a) =>
    [
      a.title,
      a.description,
      (a.tools ?? []).length ? `Tools: ${(a.tools ?? []).join(", ")}` : null,
      (a.categories ?? []).length ? `Categories: ${(a.categories ?? []).join(", ")}` : null,
      (a.functions ?? []).length ? `Functions: ${(a.functions ?? []).join(", ")}` : null,
    ].filter(Boolean).join(". "),
  );

  let embeddings: number[][];
  try {
    embeddings = await embedBatch(texts);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Embedding failed";
    return jsonWithSessionCookies(sessionResponse, { error: message }, { status: 500 });
  }

  for (let i = 0; i < activities.length; i++) {
    const { error: updateErr } = await supabase
      .from("activities")
      .update({ embedding: embeddings[i] })
      .eq("id", activities[i].id);
    if (updateErr) {
      return jsonWithSessionCookies(
        sessionResponse,
        { error: `Failed on "${activities[i].title}": ${updateErr.message}` },
        { status: 500 },
      );
    }
  }

  return jsonWithSessionCookies(sessionResponse, { synced: activities.length });
}

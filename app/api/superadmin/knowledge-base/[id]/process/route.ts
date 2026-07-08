import { NextRequest } from "next/server";
import { createRouteHandlerClient, jsonWithSessionCookies } from "@/lib/supabase/route-handler";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { processIngestionBatch } from "@/lib/kb/ingest";

/**
 * Processes one incremental batch of pages for a document. The superadmin UI
 * calls this repeatedly (short poll loop) until `done: true` — see
 * RAG_ASSISTANT_ARCHITECTURE.md §4.1 on why ingestion isn't one long request.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, sessionResponse } = createRouteHandlerClient(req);
  const auth = await requireSuperadmin(supabase);
  if (!auth.ok) return jsonWithSessionCookies(sessionResponse, { error: auth.error }, { status: auth.status });

  try {
    const result = await processIngestionBatch(supabase, id);
    return jsonWithSessionCookies(sessionResponse, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingestion failed";
    console.error(`[knowledge-base/${id}/process] ingestion error:`, err);
    await supabase.from("kb_documents").update({ status: "error", error_message: message }).eq("id", id);
    return jsonWithSessionCookies(sessionResponse, { error: message }, { status: 500 });
  }
}

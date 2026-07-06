import { NextRequest } from "next/server";
import { createRouteHandlerClient, jsonWithSessionCookies } from "@/lib/supabase/route-handler";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";

export async function GET(req: NextRequest) {
  const { supabase, sessionResponse } = createRouteHandlerClient(req);
  const auth = await requireSuperadmin(supabase);
  if (!auth.ok) return jsonWithSessionCookies(sessionResponse, { error: auth.error }, { status: auth.status });

  const { data, error } = await supabase
    .from("kb_documents")
    .select("id, title, description, page_count, status, error_message, created_at")
    .order("created_at", { ascending: false });

  if (error) return jsonWithSessionCookies(sessionResponse, { error: error.message }, { status: 500 });
  return jsonWithSessionCookies(sessionResponse, { documents: data ?? [] });
}

/**
 * Registers a PDF that the browser already uploaded directly to the
 * `kb-documents` Storage bucket (bypassing this route's body-size limit —
 * see KnowledgeBaseClient.tsx). This only creates the DB row; ingestion runs
 * via repeated calls to POST [id]/process from the client.
 */
export async function POST(req: NextRequest) {
  const { supabase, sessionResponse } = createRouteHandlerClient(req);
  const auth = await requireSuperadmin(supabase);
  if (!auth.ok) return jsonWithSessionCookies(sessionResponse, { error: auth.error }, { status: auth.status });

  const { id, title, description, storagePath } = (await req.json()) as {
    id?: string;
    title?: string;
    description?: string;
    storagePath?: string;
  };

  if (!id || !title?.trim() || !storagePath) {
    return jsonWithSessionCookies(
      sessionResponse,
      { error: "id, title, and storagePath are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("kb_documents")
    .insert({
      id,
      title: title.trim(),
      description: description?.trim() || null,
      storage_path: storagePath,
      uploaded_by: auth.userId,
    })
    .select("id, title, description, page_count, status, error_message, created_at")
    .single();

  if (error) return jsonWithSessionCookies(sessionResponse, { error: error.message }, { status: 500 });
  return jsonWithSessionCookies(sessionResponse, { document: data });
}

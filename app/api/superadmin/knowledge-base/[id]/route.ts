import { NextRequest } from "next/server";
import { createRouteHandlerClient, jsonWithSessionCookies } from "@/lib/supabase/route-handler";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";

const DOCUMENTS_BUCKET = "kb-documents";
const IMAGES_BUCKET = "kb-extracted-images";

/** Detail view for the superadmin QA panel — extracted text + extracted images, per page. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, sessionResponse } = createRouteHandlerClient(req);
  const auth = await requireSuperadmin(supabase);
  if (!auth.ok) return jsonWithSessionCookies(sessionResponse, { error: auth.error }, { status: auth.status });

  const { data: document, error: docErr } = await supabase
    .from("kb_documents")
    .select("id, title, description, page_count, status, error_message, next_page, created_at")
    .eq("id", id)
    .single();
  if (docErr || !document) {
    return jsonWithSessionCookies(sessionResponse, { error: "Document not found" }, { status: 404 });
  }

  const { data: pages } = await supabase
    .from("kb_document_pages")
    .select("page_number, raw_text")
    .eq("document_id", id)
    .order("page_number");

  const { data: images } = await supabase
    .from("kb_document_images")
    .select("page_number, image_path, width, height")
    .eq("document_id", id)
    .order("page_number");

  const imagesWithUrls = (images ?? []).map((img) => ({
    ...img,
    imageUrl: supabase.storage.from(IMAGES_BUCKET).getPublicUrl(img.image_path).data.publicUrl,
  }));

  return jsonWithSessionCookies(sessionResponse, {
    document,
    pages: pages ?? [],
    images: imagesWithUrls,
  });
}

/** Deletes the document row (cascades pages/images/chunks) plus its Storage objects. */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, sessionResponse } = createRouteHandlerClient(req);
  const auth = await requireSuperadmin(supabase);
  if (!auth.ok) return jsonWithSessionCookies(sessionResponse, { error: auth.error }, { status: auth.status });

  const { data: document } = await supabase
    .from("kb_documents")
    .select("storage_path")
    .eq("id", id)
    .single();

  const { data: images } = await supabase
    .from("kb_document_images")
    .select("image_path")
    .eq("document_id", id);

  if (images && images.length > 0) {
    await supabase.storage.from(IMAGES_BUCKET).remove(images.map((img) => img.image_path));
  }
  if (document?.storage_path) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([document.storage_path]);
  }

  const { error } = await supabase.from("kb_documents").delete().eq("id", id);
  if (error) return jsonWithSessionCookies(sessionResponse, { error: error.message }, { status: 500 });

  return jsonWithSessionCookies(sessionResponse, { ok: true });
}

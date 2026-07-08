import type { SupabaseClient } from "@supabase/supabase-js";
import { chunkPages, type PageInput } from "./chunking";
import { extractImagesFromPage } from "./extractImages";
import { embedBatch } from "@/lib/embeddings";

/** Pages processed per invocation — keeps each call well under a serverless timeout. */
const PAGES_PER_BATCH = 5;
const DOCUMENTS_BUCKET = "kb-documents";
const IMAGES_BUCKET = "kb-extracted-images";

export type IngestionResult = { done: boolean; pagesProcessed: number };

/**
 * Processes the next batch of pages for a document: extracts text + embedded
 * images, chunks + embeds the text, and writes everything to the kb_* tables.
 * Call repeatedly (the caller re-invokes until `done`) — see
 * app/api/superadmin/knowledge-base/[id]/process/route.ts.
 */
export async function processIngestionBatch(
  supabase: SupabaseClient,
  documentId: string,
): Promise<IngestionResult> {
  const { data: doc, error: docErr } = await supabase
    .from("kb_documents")
    .select("id, storage_path, page_count, next_page, status")
    .eq("id", documentId)
    .single();

  if (docErr || !doc) throw new Error(`Document not found: ${documentId}`);
  if (doc.status === "ready" || doc.status === "error") {
    return { done: true, pagesProcessed: 0 };
  }

  const { data: fileBlob, error: downloadErr } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(doc.storage_path);
  if (downloadErr || !fileBlob) {
    throw new Error(`Failed to download PDF: ${downloadErr?.message ?? "no data"}`);
  }
  const pdfBuffer = Buffer.from(await fileBlob.arrayBuffer());

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfjs = require("pdfjs-dist/build/pdf.js");
  pdfjs.GlobalWorkerOptions.workerSrc = "";
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
    disableFontFace: true,
  });
  const pdfDoc = await loadingTask.promise;
  const numPages: number = pdfDoc.numPages;

  if (doc.page_count == null) {
    await supabase
      .from("kb_documents")
      .update({ page_count: numPages, status: "processing" })
      .eq("id", documentId);
  }

  const startPage = doc.next_page > 0 ? doc.next_page : 1;
  const endPage = Math.min(startPage + PAGES_PER_BATCH - 1, numPages);
  const batchPages: PageInput[] = [];

  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);

    const textContent = await page.getTextContent();
    const rawText = (textContent.items as { str?: string }[])
      .map((item) => item.str ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    await supabase
      .from("kb_document_pages")
      .upsert(
        { document_id: documentId, page_number: pageNum, raw_text: rawText || null },
        { onConflict: "document_id,page_number" },
      );
    batchPages.push({ pageNumber: pageNum, text: rawText || null });

    const images = await extractImagesFromPage(page, pageNum);
    for (let idx = 0; idx < images.length; idx++) {
      const img = images[idx];
      const imagePath = `${documentId}/page-${pageNum}-${idx}.png`;

      const { error: uploadErr } = await supabase.storage
        .from(IMAGES_BUCKET)
        .upload(imagePath, img.buffer, { contentType: "image/png", upsert: true });
      if (uploadErr) throw new Error(`Failed to upload extracted image: ${uploadErr.message}`);

      const { error: imageInsertErr } = await supabase.from("kb_document_images").insert({
        document_id: documentId,
        page_number: pageNum,
        image_path: imagePath,
        width: img.width,
        height: img.height,
      });
      if (imageInsertErr) throw new Error(`Failed to save extracted image: ${imageInsertErr.message}`);
    }

    page.cleanup();
  }

  await loadingTask.destroy?.().catch(() => {});

  const chunks = chunkPages(batchPages);
  if (chunks.length > 0) {
    const embeddings = await embedBatch(chunks.map((c) => c.content));
    const rows = chunks.map((chunk, i) => ({
      document_id: documentId,
      page_start: chunk.pageStart,
      page_end: chunk.pageEnd,
      content: chunk.content,
      embedding: embeddings[i],
      token_count: chunk.tokenCount,
    }));
    const { error: chunkInsertErr } = await supabase.from("kb_chunks").insert(rows);
    if (chunkInsertErr) throw new Error(`Failed to insert chunks: ${chunkInsertErr.message}`);
  }

  const done = endPage >= numPages;
  await supabase
    .from("kb_documents")
    .update({
      next_page: endPage + 1,
      status: done ? "ready" : "processing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId);

  return { done, pagesProcessed: endPage - startPage + 1 };
}

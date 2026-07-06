import { NextRequest } from "next/server";
import { createRouteHandlerClient, jsonWithSessionCookies } from "@/lib/supabase/route-handler";
import { embedText } from "@/lib/embeddings";
import { anthropic } from "@/lib/anthropic";

const MATCH_COUNT = 6;
const IMAGES_BUCKET = "kb-extracted-images";

type WorkflowContext = { title?: string; description?: string; tools?: string[] };

type MatchedChunk = {
  id: string;
  document_id: string;
  page_start: number;
  page_end: number;
  content: string;
  similarity: number;
};

export async function POST(req: NextRequest) {
  const { supabase, sessionResponse } = createRouteHandlerClient(req);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonWithSessionCookies(sessionResponse, { error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    question?: string;
    sessionId?: string;
    workflowContext?: WorkflowContext;
  };

  const question = body.question?.trim();
  const sessionId = body.sessionId;
  if (!question || !sessionId) {
    return jsonWithSessionCookies(sessionResponse, { error: "question and sessionId are required" }, { status: 400 });
  }

  await supabase.from("kb_chat_messages").insert({
    user_id: user.id, session_id: sessionId, role: "user", content: question,
  });

  const queryText = body.workflowContext?.title
    ? `Workflow: ${body.workflowContext.title}. ${body.workflowContext.description ?? ""}\n\nQuestion: ${question}`
    : question;

  const embedding = await embedText(queryText);

  const { data: chunks, error: matchErr } = await supabase.rpc("match_kb_chunks", {
    query_embedding: embedding,
    match_count: MATCH_COUNT,
  });

  if (matchErr) {
    return jsonWithSessionCookies(sessionResponse, { error: matchErr.message }, { status: 500 });
  }

  const matched = (chunks ?? []) as MatchedChunk[];

  if (matched.length === 0) {
    const answer = "I don't have anything in the knowledge base yet to answer that from — ask a superadmin to upload the relevant document.";
    await supabase.from("kb_chat_messages").insert({
      user_id: user.id, session_id: sessionId, role: "assistant", content: answer, cited_chunks: [],
    });
    return jsonWithSessionCookies(sessionResponse, { answer, citations: [] });
  }

  const documentIds = [...new Set(matched.map((c) => c.document_id))];
  const { data: docs } = await supabase.from("kb_documents").select("id, title").in("id", documentIds);
  const titleById = new Map((docs ?? []).map((d) => [d.id, d.title as string]));

  // Matched chunks are the *retrieval* unit (a chunk can span several pages), but the
  // *citation* unit shown to Claude and the user is a single page — otherwise a chunk
  // spanning e.g. pages 6–10 shows as one sprawling multi-topic excerpt with every
  // image from all 5 pages attached, even though the answer came from one of them.
  const { data: pageRows } = await supabase
    .from("kb_document_pages")
    .select("document_id, page_number, raw_text")
    .in("document_id", documentIds);
  const pageTextByKey = new Map((pageRows ?? []).map((p) => [`${p.document_id}:${p.page_number}`, p.raw_text ?? ""]));

  const seenPageKeys = new Set<string>();
  const excerpts: { documentId: string; pageNumber: number; title: string; text: string; sourceChunkId: string }[] = [];
  for (const c of matched) {
    for (let p = c.page_start; p <= c.page_end; p++) {
      const key = `${c.document_id}:${p}`;
      if (seenPageKeys.has(key)) continue;
      seenPageKeys.add(key);
      excerpts.push({
        documentId: c.document_id,
        pageNumber: p,
        title: titleById.get(c.document_id) ?? "Untitled document",
        text: pageTextByKey.get(key) ?? "",
        sourceChunkId: c.id,
      });
    }
  }

  const excerptsBlock = excerpts
    .map((e, i) => `[${i + 1}] (Doc: "${e.title}", p. ${e.pageNumber})\n${e.text}`)
    .join("\n\n");

  const systemPrompt = `You are the AI Workflow Assistant. Users ask whether they can build a specific workflow, or ask general questions, using only the knowledge base excerpts below.

Rules:
- Answer only using the excerpts provided. If they don't contain the answer, say "I don't have that in the knowledge base yet" — never guess or use outside knowledge.
- Format the answer in structured markdown (it will be rendered, not shown as raw text):
  - Lead with a direct one- or two-sentence answer, **bolding** the key fact (e.g. a yes/no or the core capability/limitation).
  - If there's more than one relevant point, list them as bullet points rather than one long paragraph.
  - Use a short bold sub-label before a bullet group only if it genuinely aids scanning (e.g. **Limitations:**) — skip it for simple answers.
  - No filler sentences, no restating the question, no closing summary.
- On the first line, output CITED:<excerpt numbers you actually used, comma-separated> (e.g. CITED:2,4). If you used none, output CITED:none.

Excerpts:
${excerptsBlock}`;

  let response;
  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      // Adaptive thinking on: even when the excerpt has a direct answer, Sonnet reasons
      // over it before answering rather than just echoing the excerpt back verbatim.
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: systemPrompt,
      messages: [{ role: "user", content: question }],
    });
  } catch (err) {
    console.error("[/api/ask] Anthropic error:", err);
    return jsonWithSessionCookies(sessionResponse, { error: "AI service unavailable" }, { status: 503 });
  }

  // Sonnet 5 runs adaptive thinking by default when `thinking` is omitted, which can
  // put a `thinking` block before the `text` block — don't assume content[0] is text.
  const textBlock = response.content.find((b) => b.type === "text");
  const raw = textBlock?.type === "text" ? textBlock.text : "";
  const citedMatch = raw.match(/^CITED:(.+)\n?/);
  let citedIndexes: number[] = [];
  let answer = raw;

  if (citedMatch) {
    answer = raw.slice(citedMatch[0].length).trim();
    if (citedMatch[1].trim() !== "none") {
      citedIndexes = citedMatch[1]
        .split(",")
        .map((s) => parseInt(s.trim(), 10) - 1)
        .filter((i) => i >= 0 && i < excerpts.length);
    }
  }

  const citedExcerpts = citedIndexes.map((i) => excerpts[i]);

  let imagesByPage: Record<string, { imageUrl: string; width: number | null; height: number | null }[]> = {};
  if (citedExcerpts.length > 0) {
    const { data: images } = await supabase
      .from("kb_document_images")
      .select("document_id, page_number, image_path, width, height")
      .in("document_id", citedExcerpts.map((e) => e.documentId));

    const citedPageKeys = new Set(citedExcerpts.map((e) => `${e.documentId}:${e.pageNumber}`));
    imagesByPage = {};
    for (const img of images ?? []) {
      const key = `${img.document_id}:${img.page_number}`;
      if (!citedPageKeys.has(key)) continue;
      const url = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(img.image_path).data.publicUrl;
      const list = imagesByPage[key] ?? [];
      list.push({ imageUrl: url, width: img.width, height: img.height });
      imagesByPage[key] = list;
    }
  }

  const citations = citedExcerpts.map((e) => ({
    documentTitle: e.title,
    pageNumber: e.pageNumber,
    excerpt: e.text,
    images: imagesByPage[`${e.documentId}:${e.pageNumber}`] ?? [],
  }));

  await supabase.from("kb_chat_messages").insert({
    user_id: user.id,
    session_id: sessionId,
    role: "assistant",
    content: answer,
    cited_chunks: [...new Set(citedExcerpts.map((e) => e.sourceChunkId))],
  });

  return jsonWithSessionCookies(sessionResponse, { answer, citations });
}

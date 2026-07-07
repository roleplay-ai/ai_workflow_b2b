import { NextRequest } from "next/server";
import { createRouteHandlerClient, jsonWithSessionCookies } from "@/lib/supabase/route-handler";
import { embedText } from "@/lib/embeddings";
import { anthropic } from "@/lib/anthropic";

const MATCH_COUNT = 6;
const WORKFLOW_MATCH_COUNT = 4;
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

type MatchedActivity = { id: string; title: string; description: string | null; similarity: number };

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

  // Fetch prior turns *before* inserting the current question, so this naturally
  // excludes it. Capped to the last few turns — enough for follow-up questions
  // ("what about PDF instead?") to resolve, without growing cost unbounded.
  const HISTORY_TURN_LIMIT = 10;
  const { data: historyRows } = await supabase
    .from("kb_chat_messages")
    .select("role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_TURN_LIMIT);
  // Map to a clean {role, content} shape — don't let created_at (needed only for
  // ordering) leak into the Anthropic messages payload.
  const history = (historyRows ?? [])
    .reverse()
    .map((h) => ({ role: h.role as "user" | "assistant", content: h.content as string }));

  await supabase.from("kb_chat_messages").insert({
    user_id: user.id, session_id: sessionId, role: "user", content: question,
  });

  // Fold recent *questions* into the retrieval query too — a bare follow-up like
  // "what about PDF instead?" has almost no signal on its own for the embedding
  // search. Deliberately excludes prior answers: a long multi-point answer about
  // the previous topic would dominate the embedding and drown out the new topic
  // word the follow-up actually introduces.
  const historyForQuery = history
    .filter((h) => h.role === "user")
    .slice(-3)
    .map((h) => `Q: ${h.content}`)
    .join("\n");
  const queryText = [
    body.workflowContext?.title ? `Workflow: ${body.workflowContext.title}. ${body.workflowContext.description ?? ""}` : null,
    historyForQuery || null,
    `Q: ${question}`,
  ].filter(Boolean).join("\n");

  const embedding = await embedText(queryText);

  const { data: chunks, error: matchErr } = await supabase.rpc("match_kb_chunks", {
    query_embedding: embedding,
    match_count: MATCH_COUNT,
  });

  if (matchErr) {
    return jsonWithSessionCookies(sessionResponse, { error: matchErr.message }, { status: 500 });
  }

  const matched = (chunks ?? []) as MatchedChunk[];

  // Same query embedding, second search — the app's own workflow catalog (activities),
  // synced on demand from the superadmin Activities page ("Sync to Ask AI"). Lets Claude
  // recommend a relevant workflow with a clickable link alongside the knowledge-base answer.
  const { data: activityMatches } = await supabase.rpc("match_activities", {
    query_embedding: embedding,
    match_count: WORKFLOW_MATCH_COUNT,
  });
  const matchedActivities = (activityMatches ?? []) as MatchedActivity[];
  const workflowsBlock = matchedActivities.length > 0
    ? matchedActivities.map((a, i) => `[${i + 1}] "${a.title}"${a.description ? ` — ${a.description}` : ""}`).join("\n")
    : "(no workflows in the catalog matched this question closely)";

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

  const excerptsBlock = excerpts.length > 0
    ? excerpts.map((e, i) => `[${i + 1}] (Doc: "${e.title}", p. ${e.pageNumber})\n${e.text}`).join("\n\n")
    : "(no excerpts were retrieved for this question — the knowledge base may not cover this topic yet)";

  const systemPrompt = `You are the AI Workflow Assistant. Users ask whether they can build a specific workflow, or ask general questions.

You have three sources of information, in priority order:
1. Knowledge base excerpts below, specific to this company's uploaded documents — always
   prefer these when they cover the question; they're more authoritative and specific than
   anything else you have access to.
2. If the excerpts don't cover the question (or none were retrieved), use the web_search
   tool to find a current, accurate answer.
3. Only fall back to your own general knowledge if neither of the above covers it.

Always tell the user plainly which source you used, e.g. "This isn't in the knowledge base,
but I found this on the web..." or "This isn't in the knowledge base — generally
speaking...". When you use web search, mention the source (site or publication name) in
your answer text, since it won't otherwise be shown separately.

Separately, below the excerpts is a list of workflows from this app's own catalog that may
be relevant to what the user is asking. If one or more genuinely relate to their question,
recommend it by name in your answer — the app turns your reference into a clickable link
automatically. Don't recommend one that isn't actually relevant just to fill space; it's
fine to recommend none.

The conversation may include earlier turns. Use them to interpret follow-up questions
(e.g. "what about PDF instead?" referring back to the previous topic) — but every
excerpt/workflow list is scoped to the *current* question only, so judge whether *these*
lists cover it, not what may have been cited earlier.

Rules:
- Prefer the excerpts below when they answer the question — answer strictly from them and cite which ones you used.
- If they don't answer the question, search the web before answering from memory alone. Say briefly that it's not in the knowledge base first.
- If any of the Suggested Workflows are genuinely relevant, mention it/them by name in your answer.
- Format the answer in structured markdown (it will be rendered, not shown as raw text):
  - Lead with a direct one- or two-sentence answer, **bolding** the key fact (e.g. a yes/no or the core capability/limitation).
  - If there's more than one relevant point, list them as bullet points rather than one long paragraph.
  - Use a short bold sub-label before a bullet group only if it genuinely aids scanning (e.g. **Limitations:**) — skip it for simple answers.
  - No filler sentences, no restating the question, no closing summary.
- On the first line, output CITED:<excerpt numbers you actually used, comma-separated> (e.g. CITED:2,4). These numbers refer *only* to the numbered items in the Excerpts list — never to web search results, workflows, or anything else. If your answer did not use any numbered excerpt (e.g. you used web search or general knowledge instead), you must output CITED:none.
- On the second line, output WORKFLOWS:<numbers of any relevant workflows, comma-separated> (e.g. WORKFLOWS:1,3), referring *only* to the numbered Suggested Workflows list below. Output WORKFLOWS:none if none are relevant.

Excerpts:
${excerptsBlock}

Suggested workflows (from this app's own catalog — recommend only if genuinely relevant):
${workflowsBlock}`;

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
      messages: [...history, { role: "user", content: question }],
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
    });
  } catch (err) {
    console.error("[/api/ask] Anthropic error:", err);
    return jsonWithSessionCookies(sessionResponse, { error: "AI service unavailable" }, { status: 503 });
  }

  // Sonnet 5 runs adaptive thinking by default when `thinking` is omitted, which can put
  // a `thinking` block before the `text` block. With web_search enabled, the response can
  // also carry server_tool_use/web_search_tool_result blocks interleaved with *multiple*
  // text blocks (citations split the answer up) — concatenate every text block in order
  // rather than assuming there's exactly one.
  const raw = response.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");
  const citedMatch = raw.match(/^CITED:(.+)\n?/);
  let citedIndexes: number[] = [];
  let rest = raw;

  if (citedMatch) {
    rest = raw.slice(citedMatch[0].length);
    if (citedMatch[1].trim() !== "none") {
      citedIndexes = citedMatch[1]
        .split(",")
        .map((s) => parseInt(s.trim(), 10) - 1)
        .filter((i) => i >= 0 && i < excerpts.length);
    }
  }

  const workflowsMatch = rest.match(/^\s*WORKFLOWS:(.+)\n?/);
  let workflowIndexes: number[] = [];
  let answer = rest.trim();

  if (workflowsMatch) {
    answer = rest.slice(workflowsMatch[0].length).trim();
    if (workflowsMatch[1].trim() !== "none") {
      workflowIndexes = workflowsMatch[1]
        .split(",")
        .map((s) => parseInt(s.trim(), 10) - 1)
        .filter((i) => i >= 0 && i < matchedActivities.length);
    }
  }

  const citedExcerpts = citedIndexes.map((i) => excerpts[i]);
  const suggestedWorkflows = workflowIndexes.map((i) => {
    const a = matchedActivities[i];
    return { id: a.id, title: a.title };
  });

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

  return jsonWithSessionCookies(sessionResponse, { answer, citations, suggestedWorkflows });
}

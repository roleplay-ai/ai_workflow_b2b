# AI Workflow Assistant — Architecture & Implementation Plan

**Feature:** A global "Ask AI" assistant, powered by Claude Sonnet, that answers user questions (e.g. *"can I build this kind of workflow?"*) by retrieving relevant passages — plus the actual figures/screenshots/diagrams extracted from those pages — out of a knowledge base of PDFs that superadmins upload and manage. This is a Retrieval-Augmented Generation (RAG) system.

Decisions already made (confirmed with stakeholder):

| Decision | Choice |
|---|---|
| Placement | Global "Ask AI" entry point, available from anywhere in the `(b2b)` app, deep-links into workflow context when opened from the Workflows page |
| Knowledge base scope | Single global corpus — one set of PDFs superadmin manages, shared by every company/user |
| Vector store | Supabase Postgres + `pgvector` (already the project's DB — no new infra) |
| Knowledge base content | Both the PDF's **text** (chunked + embedded, the retrieval unit) and its **embedded images** (figures/screenshots — extracted individually, not full-page renders) |
| Image citations | **Extracted embedded images only** — the individual raster images inside each PDF page, not a screenshot of the whole page |
| Answering model | Claude **Sonnet** (`claude-sonnet-5`) |
| Embeddings provider | **Free** — Supabase's built-in `gte-small` model, run inside a Supabase Edge Function (no external API, no per-call cost) |

This plan builds on what's already in the repo rather than duplicating it: `@anthropic-ai/sdk`, `pdfjs-dist`, `@napi-rs/canvas`, Supabase (`@supabase/ssr`), the existing `lib/pdfToImages.ts` (as a reference for the pdfjs/canvas setup — see §3a on why it's not reused directly), the existing `app/api/chat/route.ts` ("Nudgie") step-coach pattern, and the existing `app/superadmin` admin shell.

### Important caveat on "extracted images"

`pdfjs-dist` can only pull out images that are stored in the PDF as **embedded raster XObjects** (photos, screenshots, scanned figures — anything that's actually a bitmap in the file). If a source PDF's "images" are really **vector drawings** (e.g. charts/diagrams drawn with lines and shapes, common in PDFs exported from PowerPoint/Word/Visio), those are not raster objects and this extraction approach will not catch them — they're part of the page's vector content, not a discrete image. **Recommend testing extraction against 1–2 real PDFs from the actual corpus early** (Build order step 3) to confirm the images in practice are raster, before assuming this covers every document.

---

## 1. What Anthropic does and doesn't provide

Claude (via `@anthropic-ai/sdk`, already installed) is the **generation** model — it reads retrieved context and writes the answer. Anthropic does **not** offer an embeddings endpoint, so a separate embeddings provider is required for the **retrieval** half of RAG.

### Chosen approach: free, via Supabase's built-in embedding model

Supabase Edge Functions can run an embedding model **natively, at no per-call cost** through their AI inference integration: `new Supabase.ai.Session('gte-small')`. This needs no external vendor, no API key, and no billing account beyond the Supabase project this app already runs on.

- **Model:** `gte-small` — 384-dimensional output, ~512-token max input per text.
- **Where it runs:** a new Supabase Edge Function (Deno runtime), *not* inside the Next.js/Vercel app — this is genuinely a second small runtime to deploy (via `supabase functions deploy embed`), but it's still part of the same Supabase project already in use, not a new vendor.
- **Trade-off vs. a paid provider (e.g. Voyage AI, OpenAI):** noticeably lower retrieval quality and a smaller max input per chunk (512 tokens vs. ~8K+ on paid models), and the model needs a cold-start "warm-up" on the Edge Function's first invocation (a few seconds) before it's fast. Acceptable for a v1 at zero cost; worth re-evaluating once there's real usage data on answer quality.
- **How it's called:** the Next.js app never imports `Supabase.ai` directly (that API only exists inside the Edge Runtime) — `lib/embeddings.ts` is a thin HTTP client that `POST`s text to the deployed Edge Function's URL and gets back embedding vectors, authenticated with the Supabase service role key server-side.
- **Because the embedding call sits behind `lib/embeddings.ts`**, switching to a paid provider later (Voyage AI's `voyage-3`/`voyage-3-large`, or OpenAI's `text-embedding-3-*`) is a matter of swapping that one file's implementation and re-embedding the existing corpus — no changes to ingestion orchestration, chunking, or retrieval/answering logic. If quality becomes a real problem, Voyage AI (Anthropic's recommended embeddings partner) is the natural upgrade path.

## 2. Answering model & pricing

| Model | ID | Input / 1M tokens | Output / 1M tokens | Role |
|---|---|---|---|---|
| Claude Sonnet 5 | `claude-sonnet-5` | $3.00 ($2.00 intro through 2026-08-31) | $15.00 ($10.00 intro) | RAG answer generation |
| Claude Haiku 4.5 | `claude-haiku-4-5` | $1.00 | $5.00 | Optional: cheap query rewriting / follow-up suggestions (mirrors the existing Nudgie pattern in `app/api/chat/route.ts`) |

Sonnet is the right tier here: answers must reason over retrieved chunks, decide whether a workflow is actually feasible, and stay grounded in the source PDFs — Haiku is fine for the lighter "Nudgie" step-coach, but this assistant is answering higher-stakes "can I do X" questions, so use Sonnet as specified.

---

## 3. Data model (Supabase / Postgres)

New migration, e.g. `supabase/migrations/20260706_knowledge_base_rag.sql`. Enables `pgvector` and adds five tables.

```sql
create extension if not exists vector;

-- One row per PDF uploaded by a superadmin
create table kb_documents (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  storage_path  text not null,          -- path in the `kb-documents` Storage bucket
  page_count    integer,
  status        text not null default 'pending'
                  check (status in ('pending', 'processing', 'ready', 'error')),
  error_message text,
  uploaded_by   uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- One row per page's extracted text (the source material chunking reads from)
create table kb_document_pages (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references kb_documents(id) on delete cascade,
  page_number   integer not null,
  raw_text      text,                   -- extracted page text (pdfjs getTextContent), pre-chunking
  unique (document_id, page_number)
);

-- One row per extracted embedded image (NOT a full-page render — see §3a)
create table kb_document_images (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references kb_documents(id) on delete cascade,
  page_number   integer not null,
  image_path    text not null,          -- path in the `kb-extracted-images` Storage bucket
  width         integer,
  height        integer,
  created_at    timestamptz not null default now()
);

create index idx_kb_document_images_doc_page on kb_document_images(document_id, page_number);

-- One row per text chunk + its embedding (the retrieval unit)
create table kb_chunks (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid not null references kb_documents(id) on delete cascade,
  page_start     integer not null,
  page_end       integer not null,
  content        text not null,
  embedding      vector(384),           -- gte-small output dimension; adjust if you change models
  token_count    integer,
  created_at     timestamptz not null default now()
);

create index kb_chunks_embedding_idx
  on kb_chunks using hnsw (embedding vector_cosine_ops);

-- Conversation log (optional but recommended for quality review + abuse monitoring)
create table kb_chat_messages (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id),
  session_id   uuid not null,           -- groups a back-and-forth conversation client-side
  role         text not null check (role in ('user', 'assistant')),
  content      text not null,
  cited_chunks uuid[] default '{}',      -- kb_chunks.id[] used to answer (assistant rows only)
  created_at   timestamptz not null default now()
);

create index idx_kb_chat_messages_session on kb_chat_messages(session_id);
```

RLS:

- `kb_documents`, `kb_document_pages`, `kb_document_images`, `kb_chunks`: **read** for any authenticated user (needed so retrieval + citation rendering works for all companies); **write** restricted to `role = 'superadmin'`.
- `kb_chat_messages`: a user can read/write only their own rows (`user_id = auth.uid()`); superadmin can read all (for QA).
- Ingestion (chunking + embedding + image extraction) runs with the Supabase **service role** key from a server route, bypassing RLS for writes — same pattern the project already uses for `app/api/admin/bulk-upload`.

Storage buckets: `kb-documents` (original PDFs, superadmin-only access) and `kb-extracted-images` (individual extracted PNGs, readable by any authenticated user via signed URLs — same access pattern as existing thumbnail/banner image handling). No page-screenshot bucket is needed since full-page renders aren't shown to users.

### 3a. Why not reuse `lib/pdfToImages.ts` as-is

`convertPdfToImages()` renders a full page to a canvas and exports that canvas as one PNG — exactly the "full page image" the stakeholder doesn't want shown. Individual embedded images require a different pdfjs code path: walking each page's **operator list** for `paintImageXObject` / `paintJpegXObject` operations and pulling the referenced bitmap out of `page.objs` / `page.commonObjs`, rather than rendering the whole page to a canvas. The new `lib/kb/extractImages.ts` (§6) reuses the *setup* already proven in `lib/pdfToImages.ts` — the `DOMMatrix` polyfill, the `require("pdfjs-dist/build/pdf.js")` + `@napi-rs/canvas` combination — but adds this new extraction path alongside it. `lib/pdfToImages.ts` itself is left untouched and can still be used elsewhere (e.g. `app/api/pdf-to-slides`) or for optional superadmin QA thumbnails (§7).

---

## 4. Ingestion pipeline (superadmin uploads a PDF)

```
Superadmin uploads PDF (superadmin UI)
        │
        ▼
POST /api/superadmin/knowledge-base
  1. Upload original PDF → Storage bucket `kb-documents`
  2. Insert kb_documents row, status = 'pending'
  3. Kick off ingestion (see below)
        │
        ▼
Ingestion job (background-safe, see §4.1 on timeouts)
  1. Extract text per page via pdfjs (getTextContent)
       → insert kb_document_pages rows (page_number, raw_text)
  2. Extract embedded images per page via pdfjs operator list (lib/kb/extractImages.ts)
       → for each paintImageXObject/paintJpegXObject op, pull the bitmap from page.objs,
         convert raw pixel data (RGB/RGBA/grayscale) to PNG via @napi-rs/canvas
       → filter out tiny/decorative images (e.g. width or height < ~80px — logos, bullets,
         hairline rules) so only meaningful figures/screenshots survive
       → upload each surviving image to `kb-extracted-images`, insert kb_document_images rows
         (page_number, image_path, width, height)
  3. Chunk each page's text (~300–400 tokens, ~15% overlap — kept under gte-small's
     ~512-token input limit; see §1), tagging each chunk with its page_start/page_end
     (a chunk that straddles a page boundary keeps both)
  4. Batch-embed chunks via the `embed` Supabase Edge Function (lib/embeddings.ts)
     → insert kb_chunks rows (content, embedding, token_count)
  5. Update kb_documents.status = 'ready' (or 'error' + error_message on failure)
```

### 4.1 Timeout risk on Vercel

The existing `app/api/pdf-to-slides` route already does synchronous PDF rasterization in a Next.js API route, so the pattern is proven for moderate PDFs — but ingesting a large document (many pages × chunking × one HTTP call per embedding batch to the `embed` Edge Function, including its cold-start warm-up) can exceed a serverless function's execution limit. Two pragmatic options, in order of preference:

1. **Chunked processing via a `kb_ingestion_jobs` status table** — the upload route does step 1 (upload + row insert) and returns immediately; a lightweight `POST /api/superadmin/knowledge-base/[id]/process` endpoint processes N pages per invocation and is re-triggered (client-side polling loop from the superadmin UI, or a Vercel Cron hitting "any pending job" every minute) until `status = 'ready'`. No new infrastructure — just a state machine over existing tables.
2. **If PDFs are consistently large,** move more of the per-page work (text/image extraction too, not just embedding) into the Supabase Edge Function itself, since it's already a separate, independently-invokable runtime from the Vercel functions — only worth the complexity if option 1 proves too slow/flaky in practice.

Start with option 1; it fits the existing all-in-Vercel deployment model and every other admin flow in this repo. Separately: keep the `embed` Edge Function "warm" by having the ingestion job's first embedding call happen as early as possible in the job, since the very first invocation after a deploy/idle period pays the `gte-small` model's load-into-memory cost.

---

## 5. Retrieval + answering pipeline ("Ask AI")

```
User asks a question (global Ask AI panel)
        │
        ▼
POST /api/ask
  1. Embed the question via the same `embed` Supabase Edge Function used at ingestion
  2. pgvector similarity search: top-K (e.g. K=6) kb_chunks by cosine distance
       select id, document_id, page_start, page_end, content
       from kb_chunks
       order by embedding <=> $1
       limit 6
  3. Build the Claude prompt:
       - system prompt: "Answer only from the provided excerpts. If the excerpts don't
         cover the question, say so — don't guess. Cite which excerpt(s) you used."
       - user turn: the question + the K retrieved chunks (with document title + page range)
  4. client.messages.create({ model: "claude-sonnet-5", ... })
  5. Parse Claude's answer + which chunk(s) it cited
  6. Resolve cited chunks → kb_document_images where document_id matches and
     page_number is between the chunk's page_start/page_end → signed image URLs
     (a chunk with no images on its page(s) simply contributes no images — text-only
     citation is expected and fine)
  7. Log to kb_chat_messages (question, answer, cited_chunks)
        │
        ▼
Response: {
  answer: string,
  citations: [{ documentTitle, pageNumber, excerpt, images: [{ imageUrl, width, height }] }]
}
```

Getting Claude to name which chunks it used (step 5) can reuse the same lightweight tagging trick already used in `app/api/chat/route.ts` (`GOTO_STEP:N` / `SUGGEST:` line-prefix parsing) — e.g. instruct Claude to prefix cited excerpt numbers with `CITED:1,3` on the first line, then strip it before displaying the answer. This avoids needing structured-output/tool-use machinery for a first version, though `output_config.format` with a JSON schema (`{answer, cited_excerpt_numbers}`) is a cleaner v2 if the line-prefix approach proves brittle.

### Example system prompt shape

```
You are the AI Workflow Assistant. Users ask whether they can build a specific
workflow, or ask general questions, using only the knowledge base excerpts below.

Rules:
- Answer only using the excerpts provided. If they don't contain the answer, say
  "I don't have that in the knowledge base yet" — never guess or use outside knowledge.
- Be concise and direct.
- On the first line, output CITED:<excerpt numbers you actually used, comma-separated>
  (e.g. CITED:2,4). If you used none, output CITED:none.

Excerpts:
[1] (Doc: "Salesforce Automation Guide", p. 12–13) <chunk text>
[2] (Doc: "Salesforce Automation Guide", p. 40) <chunk text>
...
```

---

## 6. New files

| Path | Purpose |
|---|---|
| `supabase/migrations/20260706_knowledge_base_rag.sql` | Tables + pgvector index (§3) |
| `supabase/functions/embed/index.ts` | Supabase Edge Function — runs `new Supabase.ai.Session('gte-small')`, accepts `{ texts: string[] }`, returns `{ embeddings: number[][] }` (§1) |
| `lib/embeddings.ts` | Thin HTTP client for the `embed` Edge Function — `embedText(text: string): Promise<number[]>`, `embedBatch(texts: string[]): Promise<number[][]>`. This is the one file to change if the embeddings provider is ever swapped |
| `lib/kb/chunking.ts` | Splits page text into overlapping chunks, tracks page ranges |
| `lib/kb/extractImages.ts` | Walks each page's pdfjs operator list, pulls out embedded raster images, filters decorative/tiny ones, converts to PNG (§3a, §4) |
| `lib/kb/ingest.ts` | Orchestrates §4 (pdfjs text extraction, `extractImages`, chunking, embedding, DB writes) |
| `app/api/superadmin/knowledge-base/route.ts` | `GET` (list docs), `POST` (upload new PDF) |
| `app/api/superadmin/knowledge-base/[id]/route.ts` | `DELETE` (remove doc + cascade), `GET` (status) |
| `app/api/superadmin/knowledge-base/[id]/process/route.ts` | Incremental ingestion step (§4.1 option 1) |
| `app/superadmin/knowledge-base/page.tsx` + `KnowledgeBaseClient.tsx` | Superadmin UI: upload PDF, see ingestion status, list/delete docs — same shape as existing `app/superadmin/tool-logos` or `app/superadmin/categories` pages |
| `app/api/ask/route.ts` | Retrieval + Claude Sonnet answer generation (§5) |
| `components/AskAI/AskAIPanel.tsx` | Global chat panel (floating launcher in `app/(b2b)/layout.tsx`, next to `B2BTopbar`) — question box, answer text with source excerpts, and any cited extracted-image thumbnails (click to enlarge) |
| `components/AskAI/AskAIProvider.tsx` (optional) | Client context so the panel can be opened pre-filled with a workflow's title/description when launched from the Workflows page |

---

## 7. Superadmin UI (content management)

Follows the existing superadmin patterns (`FunctionsManageClient.tsx`, `CategoriesManageClient.tsx`, `ToolLogosPageClient.tsx`):

- Upload form (PDF file input + title/description) → `POST /api/superadmin/knowledge-base`.
- Table of documents: title, page count, status badge (`pending` / `processing` / `ready` / `error`), uploaded date, delete button.
- Row click → detail view showing, per page: the extracted text (`kb_document_pages.raw_text`) and the extracted image thumbnails for that page (`kb_document_images`) — so the superadmin can immediately sanity-check both halves of what got pulled out of the PDF (and notice if a PDF's "images" turned out to be vector drawings that extraction missed, per §3a).
- Add a nav entry in `SuperadminShell.tsx` alongside the existing sections.

---

## 8. Frontend: global "Ask AI"

- A floating launcher button added to `app/(b2b)/layout.tsx` (visible on every `(b2b)` route: workflows, profile, team, updates, analytics).
- Opens `AskAIPanel` — a chat-style panel modeled on the existing Nudgie chat UI (see whatever component renders `app/api/chat` responses today, likely inside `ActivityViewClient`), but talking to `/api/ask` instead.
- When launched from the Workflows page for a specific workflow card, pass that workflow's `title`/`description`/`tools` as pre-filled context so the user's first question can just be "can I build this?" and the panel forwards the workflow metadata alongside the question.
- The answer is shown as text (with a short source excerpt/citation label per claim, e.g. "Salesforce Automation Guide, p. 12"). Any extracted images tied to the cited page(s) render as small thumbnails directly under that citation; clicking one opens it full-size (reuse whatever modal/lightbox pattern `ModuleHtmlModal` or existing image viewers already use). If a cited page has no extracted images, only the text excerpt shows — that's expected, not an error state.

---

## 9. Build order

1. **Migration** — `pgvector` extension + 5 tables + RLS (§3).
2. **`supabase/functions/embed`** + **`lib/embeddings.ts`** — deploy the Edge Function, test it standalone (`supabase functions serve` locally, then a real `curl` against the deployed URL) against a sample string before wiring it into anything else.
3. **Ingestion** (`lib/kb/chunking.ts`, `lib/kb/extractImages.ts`, `lib/kb/ingest.ts`, the 3 superadmin API routes) — get one PDF end-to-end into `kb_chunks` + `kb_document_images` before touching the UI. This is also when to validate the vector-vs-raster image caveat (§3a) against a real sample PDF.
4. **Superadmin UI** — upload + status list, so content can actually be added.
5. **`/api/ask`** — retrieval + Claude Sonnet answer, tested via curl/Postman with a few real questions against the ingested PDF.
6. **`AskAIPanel`** — wire the UI, launcher in the B2B layout, workflow-context prefill.
7. **Polish** — citation image lightbox, `kb_chat_messages` logging, empty/error states ("nothing in the knowledge base yet").

---

## 10. Open items to revisit later (not blocking v1)

- **Vector-drawn "images" (§3a)** — if a batch of real PDFs turns out to rely on vector diagrams rather than raster images, extraction will silently return zero images for those pages. Options if this shows up: fall back to `lib/pdfToImages.ts` full-page render *only* for pages where `kb_document_images` came up empty but the page clearly has a figure (heuristic, fragile), or accept text-only citations for those documents.
- **Decorative-image filter threshold** — the ~80px minimum-dimension cutoff (§4) is a starting guess; tune it after looking at real extracted output in the superadmin QA view (§7) — too low and logos/bullets clutter citations, too high and small-but-relevant diagrams get dropped.
- **Multimodal retrieval** — if some answers depend on a diagram whose meaning isn't captured by the surrounding text, consider a multimodal embedding model on the extracted images themselves (rather than only page text), so an image can be a retrieval hit in its own right, not just a citation attached to a text chunk. `gte-small` is text-only, so this would require a second (likely paid) embedding path.
- **Embedding quality upgrade path** — if retrieval quality on `gte-small` proves too weak once there's real usage, swap `lib/embeddings.ts` for a paid provider (Voyage AI's `voyage-3`/`voyage-3-large`, or OpenAI's `text-embedding-3-*`). This means re-embedding the whole corpus and changing the `kb_chunks.embedding` column dimension (384 → whatever the new model outputs) — plan for a one-time backfill migration, not an in-place column edit.
- **Re-ingestion on PDF replace** — decide whether uploading a new version of an existing document should version `kb_documents` or just wipe-and-rebuild its pages/images/chunks.
- **Rate limiting / abuse** on `/api/ask` — since Sonnet costs real money per call, consider a per-user daily cap once usage data exists.

# How "Ask AI" Works — A Beginner's Guide

This document explains, in plain language, everything that happens between a superadmin uploading a PDF and a user getting an answer in the **Ask AI** page. No prior knowledge of AI/ML assumed — every technical term is explained the first time it shows up.

If you just want the short version:

> A superadmin uploads PDFs into a "knowledge base." The app reads each PDF, breaks it into small searchable pieces, and stores those pieces in a database. When a user asks a question, the app finds the pieces that are most relevant to that question, hands them to Claude (an AI model), and asks Claude to answer **using only those pieces** — nothing made up, nothing from outside the uploaded documents. The answer comes back with a citation showing exactly which page (and page image, if there is one) it came from.

This pattern — "look things up first, then let an AI write the answer using only what it found" — is called **RAG**, short for **R**etrieval-**A**ugmented **G**eneration. Think of it like an open-book exam: the AI isn't answering from memory, it's answering from the specific pages you handed it.

---

## 1. The two halves of this feature

Everything in Ask AI splits into two completely separate journeys:

```
┌─────────────────────────────┐        ┌─────────────────────────────┐
│   SUPERADMIN SIDE            │        │   USER SIDE                  │
│   "Building the library"     │        │   "Asking the librarian"     │
│                               │        │                               │
│   Upload a PDF                │        │   Type a question             │
│        ↓                     │        │        ↓                     │
│   Break it into searchable    │  ───▶  │   Find the matching pieces    │
│   pieces, store them          │  data  │        ↓                     │
│                               │        │   Ask Claude to answer using  │
│                               │        │   only those pieces           │
└─────────────────────────────┘        └─────────────────────────────┘
```

The superadmin side only needs to happen once per document. The user side happens every single time someone asks a question, and it always searches through whatever the superadmin has uploaded so far.

---

## 2. Part One: Turning a PDF into searchable knowledge

This is what happens when a superadmin goes to **Knowledge Base** in the sidebar and uploads a PDF.

### Step 2.1 — The upload itself

The superadmin fills in a title, an optional description, and picks a PDF file. The browser uploads the raw PDF file straight into cloud storage (a Supabase "Storage bucket" called `kb-documents` — think of it as a folder for files, similar to Google Drive, but only the app can access it). A new row is created in a database table called `kb_documents` with a status of `pending`.

*Where this lives:* [app/superadmin/knowledge-base/KnowledgeBaseClient.tsx](app/superadmin/knowledge-base/KnowledgeBaseClient.tsx), [app/api/superadmin/knowledge-base/route.ts](app/api/superadmin/knowledge-base/route.ts)

### Step 2.2 — Reading the PDF, a few pages at a time

A PDF can be long, and reading + processing a big document all at once could time out the server. So instead, the app processes it **in small batches — 5 pages at a time**. Each time you click "Start" or "Retry", it processes the next 5 pages and remembers where it left off (a `next_page` counter in the database), then you click again (or the UI automatically re-triggers it) until every page is done.

For each page in the batch, two separate things get pulled out:

**a) The text on the page.** The app reads every word of text on that page and saves it (in a table called `kb_document_pages`). This is the raw material that answers will eventually be built from.

**b) The pictures on the page — but only the *actual embedded images*, not a screenshot of the whole page.** This is a subtle but important distinction. A PDF page is like a piece of paper: it can have text, but it can also have real embedded pictures (like a screenshot someone pasted in, or a photo). The app goes looking specifically for those embedded pictures and pulls each one out individually, as its own separate image file, saving each one (in a table called `kb_document_images`) along with which page it came from.

> **Why not just take a screenshot of the whole page?** Because that's much less useful — if you ask "does Gemini read Excel files?" you want to see *the specific screenshot that proves it*, not the entire page with five unrelated topics on it. Pulling out just the individual embedded images means the app can show you exactly the one relevant picture, not the whole page.
>
> **A caveat worth knowing:** this only works for pictures that are stored in the PDF as an actual embedded image (a photo, a pasted screenshot, a scan). If a PDF's "picture" is actually a *drawing* made of lines and shapes (like a chart made in PowerPoint and exported to PDF), the app can't extract that as a picture — it's not stored as one internally. Those pages will just have text, no image, which is why you sometimes see "only text" on a document in the Knowledge Base list.

Small, decorative images (logos, bullet points, thin divider lines — anything under about 80 pixels wide or tall) are automatically skipped so they don't clutter up citations later.

*Where this lives:* [lib/kb/ingest.ts](lib/kb/ingest.ts) (the conductor that runs each step in order), [lib/kb/extractImages.ts](lib/kb/extractImages.ts) (the image-pulling logic)

### Step 2.3 — Chopping the text into bite-sized "chunks"

Once we have all the text for a page (or several pages), it gets cut up into smaller pieces called **chunks** — roughly 260 words each, with a bit of overlap between consecutive chunks (so a sentence that gets split across two chunks doesn't lose its meaning in either one).

> **Why chop it up at all?** Because later, when a user asks a question, the app needs to find the *specific* piece of text that answers it — not hand the AI the entire 50-page document every time (which would be slow, expensive, and would bury the actual answer in noise). Small chunks mean precise search results.

*Where this lives:* [lib/kb/chunking.ts](lib/kb/chunking.ts)

### Step 2.4 — Turning each chunk into a list of numbers (an "embedding")

This is the part that sounds the most like magic, so let's slow down.

An **embedding** is what you get when you feed a piece of text into a special AI model and it hands you back a list of numbers (384 numbers, in our case) that represent *the meaning* of that text — not the words themselves, the *meaning*. Two chunks of text that talk about similar things end up with number-lists that are mathematically "close" to each other, even if they don't share a single word in common. Two chunks about completely unrelated things end up "far apart."

Think of it like plotting every sentence you've ever read as a dot on a giant map, where sentences with similar meaning land near each other and unrelated sentences land far away. An embedding is just the (x, y, z, ...) coordinates of that dot — except instead of 2 or 3 coordinates, there are 384 of them, because meaning is complicated.

This is the one piece of the pipeline that genuinely needs its own small AI model to run (not Claude — a different, much smaller and specialized model just for this one job). We use a free option called **`gte-small`**, and instead of paying an outside company to run it, it runs for free inside **Supabase's own infrastructure** (a "Edge Function" — think of it as a small, focused program Supabase runs on our behalf, separate from the main app). Every chunk's text gets sent to this function, and it sends back the 384 numbers.

To keep this reliable, the app sends only a handful of chunks (6 at a time) per request, and automatically retries a few times with short pauses if the free server is briefly overloaded — this small, specialized worker has limited memory, so asking it to do too much in one go can make it run out of resources.

*Where this lives:* [supabase/functions/embed/index.ts](supabase/functions/embed/index.ts) (the actual embedding model, deployed to Supabase), [lib/embeddings.ts](lib/embeddings.ts) (the app's client that calls it, with retries)

### Step 2.5 — Storing everything in the database

Each chunk's text, its 384 numbers, and which pages it came from all get saved into a database table called `kb_chunks`. The database itself has a special extension called **`pgvector`** installed, which knows how to store these number-lists efficiently and — crucially — how to quickly answer the question "which chunks have numbers closest to *this* list of numbers?" That's the exact question we'll need answered every time a user asks something.

Once every page of the document has been processed this way, the document's status flips from `processing` to `ready`, and it's now part of what Ask AI can search.

*Where this lives:* [supabase/migrations/20260706_knowledge_base_rag.sql](supabase/migrations/20260706_knowledge_base_rag.sql)

---

## 3. Part Two: Answering a user's question

This is what happens every time someone on the **Ask AI** page (in the sidebar, or the button next to the search bar) types a question and hits send.

### Step 3.1 — The question arrives

The user types something like *"can Gemini read Excel sheets?"* and hits Enter. The chat page sends this to the server (`/api/ask`), along with a `sessionId` — a random ID generated once when the chat page loads, used to group all the messages in this one conversation together.

*Where this lives:* [components/AskAI/AskAIChat.tsx](components/AskAI/AskAIChat.tsx)

### Step 3.2 — Remembering the conversation so far

Before doing anything else, the server looks up the last 10 messages that belong to this same `sessionId` in the `kb_chat_messages` table (where every question and answer gets logged). This is how **follow-up questions work** — if you ask "what about PDF instead?" right after asking about Excel, the app remembers what "instead" is referring to.

Two different things use this history, in two different ways:

- **For finding the right information:** only the *previous questions* (not the long answers) get folded in, to help the search understand what you're asking about now. We deliberately leave out the previous *answers* here — a long, detailed answer about Excel would otherwise "drown out" a new question about PDFs in the search.
- **For Claude's understanding:** the full back-and-forth (questions *and* answers) gets sent to Claude, so it has the complete context of the conversation when writing its next reply.

*Where this lives:* [app/api/ask/route.ts](app/api/ask/route.ts)

### Step 3.3 — Turning the question into numbers, then searching

Just like every chunk got turned into 384 numbers back in Part One, the user's question (plus a bit of recent conversation context) gets turned into its own list of 384 numbers, using the exact same `gte-small` model.

Then the database gets asked: *"of all the chunks you're storing, which ones have numbers closest to this question's numbers?"* Thanks to `pgvector`, this is fast even with a large knowledge base. The app asks for the top 6 closest matches.

### Step 3.4 — Narrowing matches down to individual pages

Here's a subtlety: a "chunk" can span more than one page (remember, chunks are ~260 words and don't necessarily respect page boundaries). But when we show the user *why* an answer was given, we want to point at one specific page — not a vague "somewhere in pages 6 through 10."

So the app takes the matched chunks and re-expands them back into their individual pages, using the exact page text saved back in Step 2.2. Each page becomes its own numbered "excerpt" that gets shown to Claude — e.g.:

```
[1] (Doc: "Gmail Knowledge Base", p. 9)
Read Excel attachment in your gmail inbox. ChatGPT can read the excel
sheet attached in your emails and understand them correctly...

[2] (Doc: "Gmail Knowledge Base", p. 10)
Gemini can read the attached excel sheet in your email but does not
read the data correctly.
```

### Step 3.5 — Asking Claude to answer — but only from what's in front of it

Now the app builds a careful set of instructions (called a **system prompt**) for Claude, roughly saying:

> "Answer only using the excerpts below. If they don't contain the answer, say so honestly — never guess or use outside knowledge. Format your answer with bold text and bullet points where helpful. On the very first line, tell me which excerpt number(s) you actually used."

Claude then reads the question, the numbered excerpts, and the conversation history, and writes an answer — using **Claude Sonnet** with **thinking turned on** (meaning it reasons through the excerpts step by step before writing its final answer, rather than just pattern-matching and repeating text back).

Claude's raw reply looks like this:

```
CITED:2

Gemini can read the attached Excel sheet in your email, but it
does not read the data correctly.
```

*Where this lives:* [app/api/ask/route.ts](app/api/ask/route.ts) — look for `systemPrompt` and the `anthropic.messages.create(...)` call.

### Step 3.6 — Pulling out the citation and matching images

The server strips off that first `CITED:2` line (that's just bookkeeping for the app, not meant for the user to see) and keeps the rest as the actual answer text.

It then looks up excerpt #2 — which we already know is "Doc: Gmail Knowledge Base, p. 10" — and checks the `kb_document_images` table for any images that were extracted from *that exact page* back in Step 2.2. If there's a match, that image gets attached to the answer. If that page had no images (common — most pages are just text), the answer is shown with no image, which is completely normal.

This is also why the citation you see says a single page number, not a page range — even though the search matched a whole chunk, the citation always narrows back down to the one page the answer actually came from.

### Step 3.7 — Logging and displaying the answer

The final answer (plus which chunk(s) it came from, for record-keeping) gets saved into `kb_chat_messages`, and the answer, along with any citation image(s), gets sent back to the browser.

On screen, the answer is rendered as proper formatted text (bold, bullet points — using a small library called `react-markdown` that turns Claude's plain-text formatting into real styled text) rather than showing raw symbols like `**bold**`. Any citation images show up underneath as small thumbnails; clicking the little "i" button next to them reveals which document and page they came from, and clicking an image opens it full-size.

*Where this lives:* [components/AskAI/AskAIChat.tsx](components/AskAI/AskAIChat.tsx)

---

## 4. Putting it all together — one full journey

```
SUPERADMIN                                    DATABASE
────────────                                  ─────────
Uploads "Gmail Guide.pdf"        ──────▶       kb_documents (status: pending)

App reads page 9:
  "ChatGPT can read Excel..."    ──────▶       kb_document_pages (page 9 text)
  (no image on this page)

App reads page 10:
  "Gemini can read Excel but..." ──────▶       kb_document_pages (page 10 text)
  [finds an embedded screenshot] ──────▶       kb_document_images (page 10 image)

Text is chunked, each chunk
turned into 384 numbers          ──────▶       kb_chunks (text + numbers)

Document status: ready


USER                                          SERVER                                CLAUDE
────                                          ──────                                ──────
"Can Gemini read Excel?"          ──────▶     Turns question into numbers
                                               Searches kb_chunks, finds
                                               chunk covering pages 6–10
                                               Expands to individual pages,
                                               builds excerpt list             ──▶   Reads excerpts,
                                                                                      writes answer,
                                               Strips CITED tag,               ◀──   says "CITED:2"
                                               looks up page 10's image
"Gemini can read Excel      ◀──────           Sends answer + image
 but doesn't read the
 data correctly" [image]
```

---

## 5. Frequently asked "why" questions

**Why not just let Claude answer from its own general knowledge?**
Because the whole point is that answers should be trustworthy and specific to *your* uploaded documents — not Claude's general training knowledge, which could be outdated, generic, or simply wrong for your specific tools/workflows. If nothing in the knowledge base covers a question, the app is designed to say "I don't have that yet" rather than guess.

**Why free embeddings instead of a paid service?**
Anthropic (who makes Claude) doesn't offer its own embedding service — you always need a separate one for the "search" half of RAG. Paid options (like Voyage AI) tend to have better search quality, but running Supabase's built-in `gte-small` model costs nothing and was good enough to start with. If search quality ever becomes a problem, swapping to a paid option only requires changing [lib/embeddings.ts](lib/embeddings.ts) — nothing else in the app needs to change.

**Why individual images, not full-page screenshots?**
So citations can show you exactly the one relevant picture instead of a whole page with unrelated content on it.

**Why does a citation only ever show one page, when search matched a whole chunk?**
Because chunks exist purely to make *searching* effective (bigger chunks = fewer, more efficient database rows) — but *showing* a user a 5-page block of mixed topics as "the answer" would be confusing. Re-expanding back to individual pages for display gives the best of both.

**Why remember conversation history, but only pass along previous questions (not answers) to the search step?**
A long previous answer has a lot of text in it, and that text would dominate the search compared to whatever short new thing the user just asked — pulling the search results back toward the *old* topic instead of the new one. Previous *questions* are short and give just enough context without overpowering the new one.

---

## 6. Where everything lives (quick reference)

| Piece | File |
|---|---|
| Database tables + search function | [supabase/migrations/20260706_knowledge_base_rag.sql](supabase/migrations/20260706_knowledge_base_rag.sql) |
| The free embedding model (runs on Supabase) | [supabase/functions/embed/index.ts](supabase/functions/embed/index.ts) |
| App's client for calling the embedding model | [lib/embeddings.ts](lib/embeddings.ts) |
| Splitting page text into chunks | [lib/kb/chunking.ts](lib/kb/chunking.ts) |
| Pulling embedded images out of PDF pages | [lib/kb/extractImages.ts](lib/kb/extractImages.ts) |
| Runs the whole ingestion process, page batch by page batch | [lib/kb/ingest.ts](lib/kb/ingest.ts) |
| Superadmin's upload/manage screen | [app/superadmin/knowledge-base/KnowledgeBaseClient.tsx](app/superadmin/knowledge-base/KnowledgeBaseClient.tsx) |
| API routes the superadmin screen talks to | [app/api/superadmin/knowledge-base/](app/api/superadmin/knowledge-base/) |
| The actual question-answering logic | [app/api/ask/route.ts](app/api/ask/route.ts) |
| The chat page users type into | [components/AskAI/AskAIChat.tsx](components/AskAI/AskAIChat.tsx) |

---

## 7. Glossary

| Term | Plain-English meaning |
|---|---|
| **RAG** | Retrieval-Augmented Generation — look things up first, then have an AI write an answer using only what was found. |
| **Embedding** | A list of numbers that represents the *meaning* of a piece of text, so similar meanings end up as "nearby" numbers. |
| **Vector** | Just another word for "a list of numbers" — an embedding *is* a vector. |
| **Chunk** | A small piece of text (here, ~260 words) cut out of a bigger document, small enough to search precisely. |
| **pgvector** | An add-on for the database that knows how to store vectors and quickly find "which ones are closest to this one." |
| **Edge Function** | A small, focused program that Supabase runs on your behalf, separate from the main app — used here to run the free embedding model. |
| **Citation** | The specific document + page (and image, if any) an answer's information came from — shown so you can verify it yourself. |
| **Thinking (for Claude)** | The AI reasoning through a problem step-by-step before giving its final answer, rather than answering instantly. |
| **Session** | One continuous conversation in the Ask AI page — starts fresh each time you click "New chat." |

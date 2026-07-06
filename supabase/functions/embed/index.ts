// Supabase Edge Function — text embeddings via the built-in `gte-small` model.
//
// Runs on Supabase's Edge Runtime (Deno), not in the Next.js app — `Supabase.ai`
// is only available here. Free: no external API key, no per-call billing.
//
// Deploy: `supabase functions deploy embed`
// Called from lib/embeddings.ts (server-side only) with the project's
// SUPABASE_SERVICE_ROLE_KEY as the Authorization bearer token.
//
// Request:  { texts: string[] }               (max 64 per call — see MAX_BATCH)
// Response: { embeddings: number[][] }        (384-dim per text, same order as input)

const MAX_BATCH = 64;
const MAX_TEXT_LENGTH = 4000; // gte-small's ~512-token window; this is a generous char-level guard

const model = new Supabase.ai.Session("gte-small");

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { texts?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const texts = body.texts;
  if (!Array.isArray(texts) || texts.length === 0 || !texts.every((t) => typeof t === "string")) {
    return new Response(JSON.stringify({ error: "`texts` must be a non-empty string[]" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (texts.length > MAX_BATCH) {
    return new Response(JSON.stringify({ error: `Max ${MAX_BATCH} texts per call` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const embeddings: number[][] = [];
    for (const text of texts as string[]) {
      const truncated = text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text;
      const output = await model.run(truncated, { mean_pool: true, normalize: true });
      embeddings.push(Array.from(output as Iterable<number>));
    }

    return new Response(JSON.stringify({ embeddings }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[embed] gte-small inference failed:", err);
    return new Response(JSON.stringify({ error: "Embedding inference failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/**
 * Thin client for the `embed` Supabase Edge Function (gte-small model).
 *
 * This is the one place that knows how embeddings are produced — if the
 * provider ever changes (e.g. to Voyage AI), only this file needs to change;
 * ingestion (lib/kb/ingest.ts) and retrieval (app/api/ask) just call
 * embedText/embedBatch and don't know or care how the vector was made.
 *
 * Server-side only: uses the service role key, never expose this to the client.
 */

// Small on purpose: each Edge Function invocation runs the gte-small model on a
// resource-constrained free-tier worker. Batching many texts into one call risks
// WORKER_RESOURCE_LIMIT (546) — fewer texts per invocation keeps peak memory/CPU
// per call low, at the cost of more round trips.
const EDGE_FUNCTION_BATCH_LIMIT = 3;
const MAX_RETRIES = 3;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504, 546]);

function functionUrl(): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  return `${base}/functions/v1/embed`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callEmbedFunction(texts: string[]): Promise<number[][]> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  let lastError = "";
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(functionUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ texts }),
    });

    if (res.ok) {
      const data = (await res.json()) as { embeddings: number[][] };
      return data.embeddings;
    }

    const detail = await res.text().catch(() => "");
    lastError = `embed function failed (${res.status}): ${detail}`;

    // WORKER_RESOURCE_LIMIT and other transient errors can succeed on a retry —
    // a fresh worker instance may have headroom the last one didn't.
    if (!RETRYABLE_STATUSES.has(res.status) || attempt === MAX_RETRIES) break;
    await sleep(500 * 2 ** attempt); // 500ms, 1s, 2s
  }

  throw new Error(lastError);
}

/** Embed a single string. */
export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await callEmbedFunction([text]);
  return embedding;
}

/** Embed many strings, batching to stay within the Edge Function's per-call limit. */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += EDGE_FUNCTION_BATCH_LIMIT) {
    const batch = texts.slice(i, i + EDGE_FUNCTION_BATCH_LIMIT);
    const embeddings = await callEmbedFunction(batch);
    results.push(...embeddings);
  }
  return results;
}

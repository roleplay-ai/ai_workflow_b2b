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

const EDGE_FUNCTION_BATCH_LIMIT = 64;

function functionUrl(): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  return `${base}/functions/v1/embed`;
}

async function callEmbedFunction(texts: string[]): Promise<number[][]> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  const res = await fetch(functionUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ texts }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`embed function failed (${res.status}): ${detail}`);
  }

  const data = (await res.json()) as { embeddings: number[][] };
  return data.embeddings;
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

/**
 * Splits a document's per-page text into overlapping chunks sized to fit
 * gte-small's ~512-token input window, tracking which page(s) each chunk
 * came from so retrieval can resolve it back to extracted images and citations.
 */

export type PageInput = { pageNumber: number; text: string | null };
export type Chunk = { content: string; pageStart: number; pageEnd: number; tokenCount: number };

const TARGET_CHUNK_WORDS = 260; // ≈ 300-400 tokens depending on content
const OVERLAP_WORDS = 40;       // ≈ 15% of the target

export function chunkPages(pages: PageInput[]): Chunk[] {
  const words: { word: string; pageNumber: number }[] = [];
  for (const page of pages) {
    if (!page.text) continue;
    for (const word of page.text.split(/\s+/).filter(Boolean)) {
      words.push({ word, pageNumber: page.pageNumber });
    }
  }
  if (words.length === 0) return [];

  const chunks: Chunk[] = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + TARGET_CHUNK_WORDS, words.length);
    const slice = words.slice(start, end);
    const content = slice.map((w) => w.word).join(" ");
    const pageNumbers = slice.map((w) => w.pageNumber);

    chunks.push({
      content,
      pageStart: Math.min(...pageNumbers),
      pageEnd: Math.max(...pageNumbers),
      tokenCount: estimateTokenCount(content),
    });

    if (end >= words.length) break;
    start = end - OVERLAP_WORDS;
  }
  return chunks;
}

/** Rough heuristic (no tokenizer dependency) — good enough to keep chunks under gte-small's window. */
function estimateTokenCount(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.round(wordCount * 1.3);
}

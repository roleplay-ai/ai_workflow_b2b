export type AnswerSection = { title: string | null; body: string };

/** Splits an assistant answer on "## Header" markdown lines into labeled sections.
 *  Falls back to a single untitled section when no headers are present (e.g. the
 *  exact decline/fallback sentence, or an older answer from before this format). */
export function parseAnswerSections(content: string): AnswerSection[] {
  const parts = content.split(/^##\s+(.+)$/m);
  if (parts.length <= 1) return [{ title: null, body: content }];

  const sections: AnswerSection[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    sections.push({ title: parts[i].trim(), body: (parts[i + 1] ?? "").trim() });
  }
  return sections;
}

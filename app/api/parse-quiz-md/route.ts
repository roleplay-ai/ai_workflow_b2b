import { NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import type { QuizQuestion } from "@/lib/supabase/types";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const markdownText = await file.text();

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Extract every quiz question from the markdown below and return a JSON array.

Each item must be:
{
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_index": 0
}

Rules:
- correct_index is the 0-based index of the correct answer in options[]
- If the correct option is marked with "✓ CORRECT" or similar, strip that marker from the option text
- Include 2–4 options per question
- Return ONLY the raw JSON array. No explanation, no code fences, no markdown.

Markdown:
${markdownText}`,
      },
    ],
  });

  const raw = response.content[0]?.type === "text" ? response.content[0].text.trim() : "[]";

  const start = raw.indexOf("[");
  const end   = raw.lastIndexOf("]");

  if (start === -1 || end === -1) {
    return NextResponse.json({ error: "Claude did not return a JSON array", raw: raw.slice(0, 300) }, { status: 500 });
  }

  let questions: QuizQuestion[] = [];
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));
    // Normalise — old format uses "correct", new format uses "correct_index"
    questions = parsed.map((q: any) => ({
      question:      q.question ?? "",
      options:       (q.options ?? []).map((o: string) => o.replace(/\s*✓\s*CORRECT\s*/gi, "").trim()),
      correct_index: typeof q.correct_index === "number" ? q.correct_index
                   : typeof q.correct       === "number" ? q.correct
                   : 0,
    }));
  } catch {
    return NextResponse.json({ error: "Failed to parse Claude response", raw: raw.slice(0, 300) }, { status: 500 });
  }

  return NextResponse.json({ questions, total: questions.length });
}

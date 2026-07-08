/** Server-side guardrails for the Ask AI (/api/ask) endpoint. */

export const ASK_LIMITS = {
  maxQuestionChars: 2000,
  maxAnswerChars: 800,
  maxWorkflowContextChars: 500,
  hourlyUserMessages: 10,
  dailyUserMessages: 30,
  maxWebSearchUses: 5,
  minRepeatIntervalMs: 3000,
} as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Common prompt-injection / jailbreak patterns — block before calling the model. */
const INJECTION_PATTERNS = [
  /ignore (all )?(previous|prior|above|system) (instructions|rules|prompts?)/i,
  /disregard (your|the) (instructions|rules|system prompt)/i,
  /you are now (a |an )?(?!nudgie)/i,
  /(reveal|show|print|repeat) (your )?(system prompt|hidden instructions|full prompt)/i,
  /\bjailbreak\b/i,
  /\bDAN mode\b/i,
  /pretend (you('re| are)|to be) (?!a workflow)/i,
  /<\/?system>/i,
  /\[INST\]/i,
];

export type AskValidationResult =
  | { ok: true; question: string }
  | { ok: false; status: number; error: string };

export function validateSessionId(sessionId: unknown): sessionId is string {
  return typeof sessionId === "string" && UUID_RE.test(sessionId);
}

export function validateQuestion(question: unknown): AskValidationResult {
  if (typeof question !== "string") {
    return { ok: false, status: 400, error: "question must be a string" };
  }

  const trimmed = question.trim();
  if (!trimmed) {
    return { ok: false, status: 400, error: "question is required" };
  }
  if (trimmed.length > ASK_LIMITS.maxQuestionChars) {
    return {
      ok: false,
      status: 400,
      error: `Question is too long (max ${ASK_LIMITS.maxQuestionChars} characters).`,
    };
  }
  if (INJECTION_PATTERNS.some((p) => p.test(trimmed))) {
    return {
      ok: false,
      status: 400,
      error: "That message can't be processed. Ask a workflow or knowledge-base question instead.",
    };
  }

  return { ok: true, question: trimmed };
}

export function validateWorkflowContext(
  ctx: unknown,
): { ok: true; title?: string; description?: string; tools?: string[] } | { ok: false; status: number; error: string } {
  if (ctx == null) return { ok: true };
  if (typeof ctx !== "object") {
    return { ok: false, status: 400, error: "workflowContext must be an object" };
  }

  const { title, description, tools } = ctx as Record<string, unknown>;
  const parts: string[] = [];
  if (title != null) {
    if (typeof title !== "string" || title.length > 200) {
      return { ok: false, status: 400, error: "Invalid workflow title" };
    }
    parts.push(title);
  }
  if (description != null) {
    if (typeof description !== "string" || description.length > ASK_LIMITS.maxWorkflowContextChars) {
      return { ok: false, status: 400, error: "Invalid workflow description" };
    }
    parts.push(description);
  }
  if (tools != null) {
    if (!Array.isArray(tools) || tools.length > 20 || tools.some((t) => typeof t !== "string" || t.length > 80)) {
      return { ok: false, status: 400, error: "Invalid workflow tools" };
    }
  }

  return {
    ok: true,
    title: typeof title === "string" ? title : undefined,
    description: typeof description === "string" ? description : undefined,
    tools: Array.isArray(tools) ? (tools as string[]) : undefined,
  };
}

function parseIndexList(value: string, max: number): number[] {
  if (value.trim() === "none") return [];
  return value
    .split(",")
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((i) => i >= 0 && i < max);
}

/** Parse CITED:/WORKFLOWS: tags wherever the model placed them and strip from visible answer. */
export function parseAskResponseTags(
  raw: string,
  excerptCount: number,
  activityCount: number,
): { citedIndexes: number[]; workflowIndexes: number[]; answer: string } {
  let citedIndexes: number[] = [];
  let workflowIndexes: number[] = [];
  let answer = raw;

  const citedMatch = answer.match(/^\s*CITED:(.+)$/m);
  if (citedMatch) {
    citedIndexes = parseIndexList(citedMatch[1], excerptCount);
    answer = answer.replace(citedMatch[0], "");
  }

  const workflowsMatch = answer.match(/^\s*WORKFLOWS:(.+)$/m);
  if (workflowsMatch) {
    workflowIndexes = parseIndexList(workflowsMatch[1], activityCount);
    answer = answer.replace(workflowsMatch[0], "");
  }

  return { citedIndexes, workflowIndexes, answer: answer.trim() };
}

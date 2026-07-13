/** Server-side guardrails for the Ask AI (/api/ask) endpoint. */

export const ASK_LIMITS = {
  maxQuestionChars: 2000,
  maxAnswerChars: 800,
  maxWorkflowContextChars: 500,
  hourlyUserMessages: 50,
  dailyUserMessages: 100,
  maxWebSearchUses: 5,
  minRepeatIntervalMs: 3000,
  maxSupportContextChars: 500,
  maxReplyEmailChars: 254,
  dailySupportRequests: 5,
} as const;

/** Shown to the user (and required verbatim from the model) whenever Ask AI genuinely
 *  can't help — the "Ask our team" dialog is the real fulfillment of this promise. */
export const ASK_FALLBACK_SENTENCE =
  "I currently can't help you with that — would you like to email us this question?";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export type SupportRequestValidationResult =
  | { ok: true; question: string; context?: string }
  | { ok: false; status: number; error: string };

/** Note: no reply-to email here — the route handler fills that in from the
 *  authenticated user's account email, never from client input. */
export function validateSupportRequest(body: unknown): SupportRequestValidationResult {
  if (body == null || typeof body !== "object") {
    return { ok: false, status: 400, error: "Invalid request body" };
  }
  const { question, context } = body as Record<string, unknown>;

  const questionResult = validateQuestion(question);
  if (!questionResult.ok) return questionResult;

  let trimmedContext: string | undefined;
  if (context != null) {
    if (typeof context !== "string" || context.length > ASK_LIMITS.maxSupportContextChars) {
      return {
        ok: false,
        status: 400,
        error: `Context is too long (max ${ASK_LIMITS.maxSupportContextChars} characters).`,
      };
    }
    trimmedContext = context.trim() || undefined;
  }

  return { ok: true, question: questionResult.question, context: trimmedContext };
}

/** Basic sanity check on the account email pulled server-side for reply_to_email. */
export function isValidEmail(email: string): boolean {
  return email.length > 0 && email.length <= ASK_LIMITS.maxReplyEmailChars && EMAIL_RE.test(email);
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

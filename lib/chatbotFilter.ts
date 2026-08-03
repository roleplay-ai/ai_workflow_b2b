import { normalizeActivityTools, normalizeToolSlug } from "@/lib/tools";

export const CHATBOT_FILTERS = ["claude", "chatgpt", "gemini", "copilot"] as const;

export type ChatbotFilter = (typeof CHATBOT_FILTERS)[number];

export const CHATBOT_FILTER_LABELS: Record<ChatbotFilter, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  copilot: "Copilot",
};

export function isChatbotFilter(value: unknown): value is ChatbotFilter {
  return typeof value === "string" && (CHATBOT_FILTERS as readonly string[]).includes(value);
}

export function isAiAgentWorkflow(contentType: string | null | undefined): boolean {
  return (contentType ?? "").trim().toLowerCase() === "ai agents";
}

export function activityMatchesChatbotFilter(
  activity: { tools?: string[] | null; content_type?: string | null },
  chatbot: ChatbotFilter,
): boolean {
  if (isAiAgentWorkflow(activity.content_type)) return true;
  const normalizedChatbot = normalizeToolSlug(chatbot);
  return normalizeActivityTools(activity.tools).includes(normalizedChatbot);
}

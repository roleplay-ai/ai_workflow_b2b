import { normalizeToolSlug } from "@/lib/tools";

/** Onboarding Q1 labels → activity `tools` slugs. */
const ONBOARDING_TOOL_SLUGS: Record<string, string> = {
  Claude: "claude",
  Gemini: "gemini",
  Copilot: "copilot",
  ChatGPT: "chatgpt",
};

/** Returns null when the user picked "None" or has no mappable tool. */
export function onboardingToolToSlug(tool: string): string | null {
  if (!tool || tool === "None") return null;
  return ONBOARDING_TOOL_SLUGS[tool] ?? normalizeToolSlug(tool);
}

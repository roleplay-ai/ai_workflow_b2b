export const DEFAULT_TOOLS = [
  "claude",
  "chatgpt",
  "gemini",
  "copilot",
  "agentic-workflows",
] as const;

export type DefaultToolId = (typeof DEFAULT_TOOLS)[number];

const TOOL_LABELS: Record<DefaultToolId, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  copilot: "Copilot",
  "agentic-workflows": "Agentic Workflows",
};

export const TOOL_COLORS: Record<string, string> = {
  claude: "#623CEA",
  chatgpt: "#23CE68",
  gemini: "#3696FC",
  copilot: "#F68A29",
  "agentic-workflows": "#623CEA",
};

export function formatToolLabel(tool: string): string {
  if (!tool) return "";
  const key = tool.toLowerCase() as DefaultToolId;
  if (TOOL_LABELS[key]) return TOOL_LABELS[key];
  return key
    .split("-")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function normalizeToolSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function normalizeActivityTools(tools: string[] | null | undefined): string[] {
  return [...new Set((tools ?? []).map(normalizeToolSlug).filter(Boolean))];
}

export function toolColor(tool: string): string {
  return TOOL_COLORS[tool.toLowerCase()] ?? "#FFCE00";
}

/** Default tools seeded on fresh installs; custom tools are stored in tool_logos. */
export const DEFAULT_TOOLS = [
  "claude",
  "chatgpt",
  "gemini",
  "copilot",
  "agentic-workflows",
] as const;

/** @deprecated Use DEFAULT_TOOLS — kept for imports that expect TOOLS. */
export const TOOLS = DEFAULT_TOOLS;

export type DefaultToolId = (typeof DEFAULT_TOOLS)[number];

const DEFAULT_TOOL_SET = new Set<string>(DEFAULT_TOOLS);

const TOOL_LABELS: Record<DefaultToolId, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  copilot: "Copilot",
  "agentic-workflows": "Agentic workflows",
};

export function normalizeToolSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function formatToolLabel(tool: string): string {
  if (!tool) return "";
  const key = tool.toLowerCase() as DefaultToolId;
  if (TOOL_LABELS[key]) return TOOL_LABELS[key];
  return key
    .split("-")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Defaults first (in catalog order), then custom tools alphabetically. */
export function sortToolSlugs(tools: Iterable<string>): string[] {
  const unique = [...new Set([...tools].map(t => t.toLowerCase()).filter(Boolean))];
  const defaults = DEFAULT_TOOLS.filter(t => unique.includes(t));
  const custom = unique.filter(t => !DEFAULT_TOOL_SET.has(t)).sort();
  return [...defaults, ...custom];
}

export function normalizeActivityTools(tools: string[] | null | undefined): string[] {
  return normalizeToolList(tools ?? []);
}

export function activityHasTool(
  tools: string[] | null | undefined,
  toolSlug: string,
): boolean {
  const normalized = normalizeToolSlug(toolSlug);
  if (!normalized || normalized === "all") return true;
  return normalizeActivityTools(tools).includes(normalized);
}

export function collectToolSlugs(
  registeredTools: Iterable<string>,
  activityTools: Iterable<string[]>,
): string[] {
  const all = new Set<string>();
  for (const tool of registeredTools) {
    const slug = normalizeToolSlug(tool);
    if (slug) all.add(slug);
  }
  for (const tools of activityTools) {
    for (const tool of tools ?? []) {
      const slug = normalizeToolSlug(tool);
      if (slug) all.add(slug);
    }
  }
  return sortToolSlugs(all);
}

export function buildDashboardToolFilters(
  registeredTools: Iterable<string>,
  activityTools: Iterable<string[]>,
): string[] {
  return ["all", ...collectToolSlugs(registeredTools, activityTools)];
}

export function normalizeToolList(tools: string[]): string[] {
  return [...new Set(tools.map(normalizeToolSlug).filter(Boolean))];
}

export type FluencyToolLink = { name: string; try_url: string | null };

/** Map normalized tool slug → try URL from fluency_tools catalog. */
export function buildToolTryUrlMap(tools: FluencyToolLink[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const t of tools) {
    const slug = normalizeToolSlug(t.name);
    const url = t.try_url?.trim();
    if (slug && url && !map[slug]) map[slug] = url;
  }
  return map;
}

/** First activity tool that has a resolved try URL. */
export function resolveActivityToolUrl(
  activityTools: string[],
  tryUrlMap: Record<string, string>,
): { slug: string; url: string; label: string } | null {
  for (const slug of activityTools) {
    const url = tryUrlMap[slug];
    if (url) return { slug, url, label: formatToolLabel(slug) };
  }
  return null;
}

/** Activity overview open link: custom try_link first, else fluency_tools catalog. */
export function resolveActivityOpenLink(
  tryLink: string | null | undefined,
  activityTools: string[],
  tryUrlMap: Record<string, string>,
): { url: string; label: string } | null {
  const custom = tryLink?.trim();
  const toolLink = resolveActivityToolUrl(activityTools, tryUrlMap);
  if (custom) {
    return { url: custom, label: toolLink?.label ?? "Tool" };
  }
  if (!toolLink) return null;
  return { url: toolLink.url, label: toolLink.label };
}

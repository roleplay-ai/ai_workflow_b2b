import { DEFAULT_TOOLS, formatToolLabel, normalizeToolSlug, sortToolSlugs } from "@/lib/tools";

export type ToolLogoRow = { tool: string; logo_url: string };

export type ToolLogoMap = Record<string, string>;
export type TagLogoMap = Record<string, string>;

export function rowsToToolLogoMap(rows: ToolLogoRow[] | null | undefined): ToolLogoMap {
  const map: ToolLogoMap = {};
  const priority: Record<string, number> = {};

  for (const row of rows ?? []) {
    const key = normalizeToolSlug(row.tool);
    const url = row.logo_url?.trim();
    if (!key || !url) continue;

    // Prefer canonical lowercase slugs (e.g. "claude") over display variants ("Claude").
    const rowPriority = row.tool === key ? 2 : 1;
    if (!(key in map) || rowPriority > (priority[key] ?? 0)) {
      map[key] = url;
      priority[key] = rowPriority;
    }
  }

  return map;
}

export type TagLogoRow = { name: string; icon_url: string | null };

export function rowsToTagLogoMap(rows: TagLogoRow[] | null | undefined): TagLogoMap {
  const map: TagLogoMap = {};
  for (const row of rows ?? []) {
    if (row.icon_url) map[row.name.toLowerCase()] = row.icon_url;
  }
  return map;
}

export function resolveToolLogoUrl(
  tool: string,
  logos: ToolLogoMap,
): string | null {
  const url = logos[normalizeToolSlug(tool)]?.trim();
  return url || null;
}

export function mergeToolSelectOptions(
  options: { name: string; displayName?: string; imageUrl?: string | null }[],
  logos: ToolLogoMap,
): { name: string; displayName: string; imageUrl: string | null }[] {
  return options.map(opt => {
    const name = normalizeToolSlug(opt.name);
    return {
      name,
      displayName: opt.displayName ?? formatToolLabel(name),
      imageUrl: opt.imageUrl?.trim() || resolveToolLogoUrl(name, logos),
    };
  });
}

export function buildToolSelectOptions(rows: ToolLogoRow[] | null | undefined): {
  name: string;
  displayName: string;
  imageUrl: string | null;
}[] {
  const logos = rowsToToolLogoMap(rows);
  const tools = sortToolSlugs([
    ...DEFAULT_TOOLS,
    ...(rows ?? []).map(r => r.tool),
  ]);
  const seen = new Set<string>();
  return tools
    .map(tool => normalizeToolSlug(tool))
    .filter(tool => {
      if (!tool || seen.has(tool)) return false;
      seen.add(tool);
      return true;
    })
    .map(tool => ({
      name: tool,
      displayName: formatToolLabel(tool),
      imageUrl: resolveToolLogoUrl(tool, logos),
    }));
}

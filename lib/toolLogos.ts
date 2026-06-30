import { normalizeToolSlug } from "./tools";

export type ToolLogoMap = Record<string, string>;

export function rowsToToolLogoMap(rows: { tool: string; logo_url: string }[] | null | undefined): ToolLogoMap {
  const map: ToolLogoMap = {};
  for (const row of rows ?? []) {
    map[row.tool.toLowerCase()] = row.logo_url;
  }
  return map;
}

export function resolveToolLogoUrl(tool: string, logos: ToolLogoMap): string | null {
  const url = logos[normalizeToolSlug(tool)]?.trim();
  return url || null;
}

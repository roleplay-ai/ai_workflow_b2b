import type { ToolDeepDive } from "@/lib/supabase/types";

export const DEEP_DIVE_PAGES_BUCKET = "deep-dive-pages";

export function isHtmlDeepDive(item: Pick<ToolDeepDive, "link_type" | "html_path">): boolean {
  return (item.link_type ?? "external") === "html" && !!item.html_path;
}

export function deepDiveHref(item: Pick<ToolDeepDive, "id" | "link_type" | "url">): string {
  if ((item.link_type ?? "external") === "html") return `/explore/${item.id}`;
  return item.url?.trim() || "#";
}

export function deepDiveLabel(item: Pick<ToolDeepDive, "link_type" | "description" | "tool">, formatTool: (t: string) => string): string {
  if (item.description) return item.description;
  if ((item.link_type ?? "external") === "html") return "Interactive guide";
  if (item.tool) return formatTool(item.tool);
  return "External resource";
}

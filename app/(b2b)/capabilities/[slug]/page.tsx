import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCapabilitySlug, PROVIDER_TOOLS, SLUG_TO_CONTENT_TYPE, type CapabilitySlug } from "@/lib/capabilities";
import { normalizeActivityTools } from "@/lib/tools";
import { rowsToToolLogoMap } from "@/lib/toolLogos";
import CapabilityClient from "./CapabilityClient";

export const dynamic = "force-dynamic";

export default async function CapabilityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isCapabilitySlug(slug)) notFound();
  const contentType = SLUG_TO_CONTENT_TYPE[slug];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: activities }, { data: toolLogoRows }] = await Promise.all([
    supabase.from("activities").select("tools").eq("published", true).eq("content_type", contentType),
    supabase.from("tool_logos").select("tool, logo_url"),
  ]);

  const toolCounts: Record<string, number> = {};
  let totalCount = 0;
  for (const activity of activities ?? []) {
    totalCount += 1;
    for (const tool of normalizeActivityTools(activity.tools as string[] | null)) {
      toolCounts[tool] = (toolCounts[tool] ?? 0) + 1;
    }
  }

  return (
    <CapabilityClient
      slug={slug as CapabilitySlug}
      totalCount={totalCount}
      toolCounts={Object.fromEntries(PROVIDER_TOOLS.map((tool) => [tool, toolCounts[tool] ?? 0]))}
      toolLogos={rowsToToolLogoMap(toolLogoRows ?? [])}
    />
  );
}

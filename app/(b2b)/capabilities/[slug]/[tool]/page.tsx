import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCapabilitySlug, isProviderTool, SLUG_TO_CONTENT_TYPE, type CapabilitySlug, type ProviderTool } from "@/lib/capabilities";
import { normalizeActivityTools, normalizeToolSlug } from "@/lib/tools";
import ToolCapabilityClient from "./ToolCapabilityClient";

export const dynamic = "force-dynamic";

export default async function ToolCapabilityPage({
  params,
}: {
  params: Promise<{ slug: string; tool: string }>;
}) {
  const { slug, tool } = await params;
  if (!isCapabilitySlug(slug) || !isProviderTool(tool)) notFound();
  const contentType = SLUG_TO_CONTENT_TYPE[slug];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: activities } = await supabase
    .from("activities")
    .select("tools")
    .eq("published", true)
    .eq("content_type", contentType);

  const normalizedTool = normalizeToolSlug(tool);
  const count = (activities ?? []).filter((activity) =>
    normalizeActivityTools(activity.tools as string[] | null).includes(normalizedTool),
  ).length;

  return (
    <ToolCapabilityClient
      slug={slug as CapabilitySlug}
      tool={tool as ProviderTool}
      count={count}
    />
  );
}

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isProviderTool, type ProviderTool } from "@/lib/capabilities";
import ProviderClient from "./ProviderClient";

export const dynamic = "force-dynamic";

export default async function ProviderPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  if (!isProviderTool(tool)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: activities } = await supabase
    .from("activities")
    .select("content_type, tools")
    .eq("published", true);

  const counts: Record<string, number> = {};
  for (const activity of activities ?? []) {
    const tools = ((activity.tools as string[] | null) ?? []).map((t) => t.toLowerCase());
    if (!tools.includes(tool)) continue;
    const contentType = activity.content_type as string | null;
    if (!contentType) continue;
    counts[contentType] = (counts[contentType] ?? 0) + 1;
  }

  return <ProviderClient tool={tool as ProviderTool} capabilityCounts={counts} />;
}

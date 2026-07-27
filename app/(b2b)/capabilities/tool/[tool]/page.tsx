import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isProviderTool, type ProviderTool } from "@/lib/capabilities";
import { rowsToToolLogoMap } from "@/lib/toolLogos";
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

  const { data: toolLogoRows } = await supabase.from("tool_logos").select("tool, logo_url");

  return <ProviderClient tool={tool as ProviderTool} toolLogos={rowsToToolLogoMap(toolLogoRows ?? [])} />;
}

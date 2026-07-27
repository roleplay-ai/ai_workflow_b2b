import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProviderFeature, isProviderTool, type ProviderTool } from "@/lib/capabilities";
import ProviderFeatureClient from "./ProviderFeatureClient";

export const dynamic = "force-dynamic";

export default async function ProviderFeaturePage({
  params,
}: {
  params: Promise<{ tool: string; feature: string }>;
}) {
  const { tool, feature } = await params;
  if (!isProviderTool(tool)) notFound();
  const def = getProviderFeature(tool as ProviderTool, feature);
  if (!def) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <ProviderFeatureClient tool={tool as ProviderTool} def={def} />;
}

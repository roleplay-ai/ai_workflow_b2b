import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isProviderTool, type ProviderTool } from "@/lib/capabilities";
import InsiderGuideClient from "./InsiderGuideClient";

export const dynamic = "force-dynamic";

export default async function InsiderGuidePage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  if (!isProviderTool(tool)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <InsiderGuideClient tool={tool as ProviderTool} />;
}

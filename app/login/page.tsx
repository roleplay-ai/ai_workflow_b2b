import { createClient } from "@/lib/supabase/server";
import { rowsToToolLogoMap } from "@/lib/toolLogos";
import LoginPageClient, { type FeaturedTag } from "./LoginPageClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();

  const [{ data: toolLogoRows }, { data: featuredTagRows }] = await Promise.all([
    supabase.from("tool_logos").select("tool, logo_url").order("tool"),
    supabase
      .from("activity_tags")
      .select("id, name, icon_url, featured_description")
      .eq("is_featured", true)
      .order("featured_position")
      .order("name"),
  ]);

  const toolLogos = rowsToToolLogoMap(toolLogoRows ?? []);

  return (
    <LoginPageClient
      toolLogos={toolLogos}
      featuredTags={(featuredTagRows ?? []) as FeaturedTag[]}
    />
  );
}

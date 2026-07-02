import { createClient } from "@/lib/supabase/server";
import { getPostLoginPath } from "@/lib/auth/postLogin";
import { rowsToToolLogoMap } from "@/lib/toolLogos";
import type { Role } from "@/lib/supabase/types";
import { redirect } from "next/navigation";
import LoginPageClient, { type FeaturedTag } from "./LoginPageClient";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const role = (profile?.role ?? "user") as Role;
    const params = await searchParams;
    redirect(getPostLoginPath(role, params.redirect ?? null));
  }

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

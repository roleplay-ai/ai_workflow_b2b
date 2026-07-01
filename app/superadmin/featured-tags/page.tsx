import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FeaturedTagsClient from "./FeaturedTagsClient";

export const dynamic = "force-dynamic";

export default async function FeaturedTagsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, company_id, full_name, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) redirect("/login");
  if (profile.role !== "superadmin") redirect("/apply");

  const { data: tags } = await supabase
    .from("activity_tags")
    .select("id, name, icon_url, is_featured, featured_description, featured_position, created_at")
    .order("name");

  return <FeaturedTagsClient tags={(tags ?? []) as any} />;
}

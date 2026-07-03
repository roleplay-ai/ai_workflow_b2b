import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CategoriesManageClient from "./CategoriesManageClient";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
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

  const { data: categories } = await supabase
    .from("activity_categories")
    .select("id, name, description, icon_url, thumbnail_url, created_at")
    .order("name");

  return (
    <CategoriesManageClient
      categories={(categories ?? []) as any}
    />
  );
}

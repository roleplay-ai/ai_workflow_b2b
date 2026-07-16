import { createClient } from "@/lib/supabase/server";
import EmailManagementClient from "./EmailManagementClient";

export const dynamic = "force-dynamic";

export default async function EmailManagementPage() {
  const supabase = await createClient();

  const [{ data: briefs }, { data: workflows }] = await Promise.all([
    supabase
      .from("fluency_briefs")
      .select("id, title, published_date, is_active, fluency_brief_items(id, content, sort_order)")
      .order("published_date", { ascending: false })
      .limit(10),
    supabase
      .from("activities")
      .select("id, title, description, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false }),
  ]);

  return <EmailManagementClient briefs={(briefs ?? []) as any} workflows={(workflows ?? []) as any} />;
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import KnowledgeBaseClient from "./KnowledgeBaseClient";

export const dynamic = "force-dynamic";

export default async function KnowledgeBasePage() {
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

  const { data: documents } = await supabase
    .from("kb_documents")
    .select("id, title, description, page_count, status, error_message, created_at")
    .order("created_at", { ascending: false });

  return <KnowledgeBaseClient documents={documents ?? []} />;
}

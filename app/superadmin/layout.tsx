import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SuperadminShell from "./SuperadminShell";

export const dynamic = "force-dynamic";

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role, company_id, full_name, avatar_url, created_at")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "superadmin") redirect("/apply");

  const { data: company } = profile.company_id
    ? await supabase.from("companies").select("id, name").eq("id", profile.company_id).single()
    : { data: null };

  const fullProfile = { ...profile, companies: company };

  return (
    <SuperadminShell profile={fullProfile as any}>
      {children}
    </SuperadminShell>
  );
}

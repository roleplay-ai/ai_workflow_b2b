import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import B2BSidebar from "@/components/B2BSidebar";

function initials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default async function B2BLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, email, company_id, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  let companyName: string | null = null;
  if (profile?.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", profile.company_id)
      .single();
    companyName = company?.name ?? null;
  }

  const userName = profile?.full_name ?? null;
  const userEmail = profile?.email ?? user.email ?? null;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <B2BSidebar
        companyName={companyName}
        companyInitials={companyName ? companyInitials(companyName) : "??"}
        userName={userName}
        userEmail={userEmail}
        userInitials={initials(userName, userEmail)}
      />
      <div style={{
        marginLeft: "var(--sidebar-w)",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        minWidth: 0,
      }}>
        {children}
      </div>
    </div>
  );
}

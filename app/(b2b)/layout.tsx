import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import B2BSidebar from "@/components/B2BSidebar";
import { rowsToToolLogoMap } from "@/lib/toolLogos";
import type { PreferredAiTool } from "@/lib/supabase/types";
import styles from "@/components/b2b-shell.module.css";

function initials(name: string | null, email: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

export default async function B2BLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileResult, { data: toolLogoRows }] = await Promise.all([
    supabase.from("profiles").select("full_name, email, preferred_ai_tool").eq("id", user.id).single(),
    supabase.from("tool_logos").select("tool, logo_url"),
  ]);
  let profile: { full_name: string | null; email: string | null } | null = profileResult.data;
  let defaultAiTool: PreferredAiTool | null = null;
  if (profileResult.error) {
    profile = (await supabase.from("profiles").select("full_name, email").eq("id", user.id).single()).data;
  } else {
    defaultAiTool = profileResult.data?.preferred_ai_tool as PreferredAiTool | null;
  }

  const userName = profile?.full_name ?? null;
  const userEmail = profile?.email ?? user.email ?? null;

  return (
    <div className={styles.participantShell}>
      <B2BSidebar
        userId={user.id}
        userName={userName}
        userEmail={userEmail}
        userInitials={initials(userName, userEmail)}
        toolLogos={rowsToToolLogoMap(toolLogoRows ?? [])}
        defaultTool={defaultAiTool}
      />
      <div className={styles.mainColumn}>{children}</div>
    </div>
  );
}

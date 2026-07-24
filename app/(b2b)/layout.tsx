import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import B2BSidebar from "@/components/B2BSidebar";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name ?? null;
  const userEmail = profile?.email ?? user.email ?? null;

  return (
    <div className={styles.participantShell}>
      <B2BSidebar
        userName={userName}
        userEmail={userEmail}
        userInitials={initials(userName, userEmail)}
      />
      <div className={styles.mainColumn}>{children}</div>
    </div>
  );
}

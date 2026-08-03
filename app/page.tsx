import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RedirectWithLoading from "@/components/RedirectWithLoading";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    const role = profile?.role ?? "user";

    if (role === "superadmin") redirect("/superadmin");
    if (role === "admin") redirect("/admin");
  }

  // Show the shared page-change loader on `/` until `/ask-ai` is ready.
  return <RedirectWithLoading href="/ask-ai" />;
}

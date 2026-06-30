import { createClient } from "@/lib/supabase/server";
import MasteryClient from "./MasteryClient";

export const dynamic = "force-dynamic";

export default async function MasteryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: masteryRows }, { data: profile }] = await Promise.all([
    user
      ? supabase.from("ai_mastery_progress").select("module_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { module_id: string }[] }),
    user
      ? supabase.from("profiles").select("full_name").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  const completedModules = (masteryRows ?? []).map(r => r.module_id as string);
  const userName = (profile as any)?.full_name ?? null;

  return <MasteryClient completedModules={completedModules} userName={userName} />;
}

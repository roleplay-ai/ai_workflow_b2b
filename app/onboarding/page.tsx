import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: functionRows }, { data: categoryRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("onboarding_completed_at, onboarding_tool, onboarding_tool_tier, onboarding_tool_other, onboarding_function, onboarding_function_other, onboarding_interests, onboarding_interests_other, onboarding_experience")
      .eq("id", user.id)
      .single(),
    supabase.from("activity_functions").select("id, name").order("name"),
    supabase.from("activity_categories").select("id, name").order("name"),
  ]);

  const mode: "mandatory" | "update" = profile?.onboarding_completed_at ? "update" : "mandatory";

  return (
    <OnboardingClient
      mode={mode}
      functionOptions={(functionRows ?? []).map(r => r.name)}
      categoryOptions={(categoryRows ?? []).map(r => r.name)}
      existingAnswers={mode === "update" ? {
        tool: profile?.onboarding_tool ?? null,
        toolTier: profile?.onboarding_tool_tier ?? null,
        toolOther: profile?.onboarding_tool_other ?? null,
        jobFunction: profile?.onboarding_function ?? null,
        jobFunctionOther: profile?.onboarding_function_other ?? null,
        interests: profile?.onboarding_interests ?? [],
        interestsOther: profile?.onboarding_interests_other ?? null,
        experience: profile?.onboarding_experience ?? null,
      } : null}
    />
  );
}

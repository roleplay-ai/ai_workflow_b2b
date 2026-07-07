import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { userNeedsOnboarding } from "@/lib/auth/onboardingGate";
import B2BTopbar from "@/components/B2BTopbar";
import AskAIChat from "@/components/AskAI/AskAIChat";

export const dynamic = "force-dynamic";

export default async function AskAIPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // We always fetch onboarding-support data so the client can force-show the
  // AskAI onboarding UI (e.g. for "?onboarding=update") even if the server-side
  // searchParams are unavailable in a given rendering path.
  const [{ data: profile }, { data: functionRows }, { data: categoryRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("onboarding_tool, onboarding_tool_tier, onboarding_tool_other, onboarding_function, onboarding_function_other, onboarding_interests, onboarding_interests_other, onboarding_experience")
      .eq("id", user.id)
      .single(),
    supabase.from("activity_functions").select("id, name").order("name"),
    supabase.from("activity_categories").select("id, name").order("name"),
  ]);

  const functionOptions: string[] = (functionRows ?? []).map((r) => r.name);
  const categoryOptions: string[] = (categoryRows ?? []).map((r) => r.name);
  const existingAnswers = {
    tool: profile?.onboarding_tool ?? null,
    toolTier: profile?.onboarding_tool_tier ?? null,
    toolOther: profile?.onboarding_tool_other ?? null,
    jobFunction: profile?.onboarding_function ?? null,
    jobFunctionOther: profile?.onboarding_function_other ?? null,
    interests: profile?.onboarding_interests ?? [],
    interestsOther: profile?.onboarding_interests_other ?? null,
    experience: profile?.onboarding_experience ?? null,
  };

  const onboardingParam = searchParams?.onboarding;
  const onboardingMode = Array.isArray(onboardingParam) ? onboardingParam[0] : onboardingParam;
  const forceOnboarding = onboardingMode === "update";

  const needsOnboarding = forceOnboarding || await userNeedsOnboarding(supabase, user.id);

  return (
    <>
      <B2BTopbar />
      <Suspense fallback={null}>
        <AskAIChat
          needsOnboarding={needsOnboarding}
          functionOptions={functionOptions}
          categoryOptions={categoryOptions}
          existingAnswers={existingAnswers}
        />
      </Suspense>
    </>
  );
}

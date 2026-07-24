import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import B2BTopbar from "@/components/B2BTopbar";
import AskAIChat from "@/components/AskAI/AskAIChat";

export const dynamic = "force-dynamic";

export default async function AskAIPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Onboarding-support data is always fetched; the client handles ?onboarding=update
  // via useSearchParams so we don't need server-side searchParams here.
  const [{ data: profile }, { data: functionRows }, { data: categoryRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("onboarding_tool, onboarding_tool_tier, onboarding_tool_other, onboarding_function, onboarding_function_other, onboarding_interests, onboarding_interests_other")
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
  };

  return (
    <>
      <B2BTopbar />
      <Suspense fallback={null}>
        <AskAIChat
          needsOnboarding={false}
          functionOptions={functionOptions}
          categoryOptions={categoryOptions}
          existingAnswers={existingAnswers}
        />
      </Suspense>
    </>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { onboardingExperienceToLevels, onboardingToolToSlug } from "@/lib/onboarding";
import { createRouteHandlerClient, jsonWithSessionCookies } from "@/lib/supabase/route-handler";

type CompleteBody = {
  tool: string;
  toolTier: string | null;
  toolOther: string | null;
  jobFunction: string;
  jobFunctionOther: string | null;
  interests: string[];
  interestsOther: string | null;
  experience: string;
};

export async function POST(req: NextRequest) {
  const { supabase, sessionResponse } = createRouteHandlerClient(req);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return jsonWithSessionCookies(sessionResponse, { error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as Partial<CompleteBody>;
  const {
    tool, toolTier = null, toolOther = null,
    jobFunction, jobFunctionOther = null,
    interests, interestsOther = null,
    experience,
  } = body;

  if (!tool || !jobFunction || !experience || !Array.isArray(interests) || interests.length === 0) {
    return jsonWithSessionCookies(sessionResponse, { error: "Missing required onboarding answers" }, { status: 400 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      onboarding_completed_at: new Date().toISOString(),
      onboarding_tool: tool,
      onboarding_tool_tier: toolTier,
      onboarding_tool_other: toolOther,
      onboarding_function: jobFunction,
      onboarding_function_other: jobFunctionOther,
      onboarding_interests: interests,
      onboarding_interests_other: interestsOther,
      onboarding_experience: experience,
      workflows_confirmed_at: null,
    })
    .eq("id", user.id);

  if (profileError) {
    return jsonWithSessionCookies(sessionResponse, { error: profileError.message }, { status: 500 });
  }

  // Match: category overlap + function + tool + level (when applicable).
  let matchQuery = supabase
    .from("activities")
    .select("id")
    .eq("published", true)
    .overlaps("categories", interests);

  if (jobFunction !== "Other") {
    matchQuery = matchQuery.contains("functions", [jobFunction]);
  }

  const toolSlug = onboardingToolToSlug(tool);
  if (toolSlug) {
    matchQuery = matchQuery.contains("tools", [toolSlug]);
  }

  const levels = onboardingExperienceToLevels(experience);
  if (levels.length > 0) {
    matchQuery = matchQuery.in("level", levels);
  }

  const { data: matched, error: matchError } = await matchQuery;
  if (matchError) {
    return jsonWithSessionCookies(sessionResponse, { error: matchError.message }, { status: 500 });
  }

  // Replace the whole snapshot — full recompute on every onboarding completion.
  const { error: deleteError } = await supabase
    .from("user_saved_workflows")
    .delete()
    .eq("user_id", user.id);
  if (deleteError) {
    return jsonWithSessionCookies(sessionResponse, { error: deleteError.message }, { status: 500 });
  }

  const matchedActivities = matched ?? [];
  if (matchedActivities.length > 0) {
    const { error: insertError } = await supabase
      .from("user_saved_workflows")
      .insert(matchedActivities.map(a => ({ user_id: user.id, activity_id: a.id })));
    if (insertError) {
      return jsonWithSessionCookies(sessionResponse, { error: insertError.message }, { status: 500 });
    }
  }

  return jsonWithSessionCookies(sessionResponse, { matchedCount: matchedActivities.length });
}

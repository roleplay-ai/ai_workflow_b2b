import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rowsToToolLogoMap } from "@/lib/toolLogos";
import { buildToolTryUrlMap } from "@/lib/tools";
import ActivityViewClient from "./ActivityViewClient";

type Props = { params: Promise<{ id: string }> };

export default async function ActivityPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: onboardingProfile, error: onboardingError },
    { data: activity },
    { data: activitySteps },
    { data: logoRows },
    { data: toolRows },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*, companies(name)")
      .eq("id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("activities")
      .select("*, activity_content(*)")
      .eq("id", id)
      .single(),
    supabase
      .from("activity_steps")
      .select("*")
      .eq("activity_id", id)
      .order("step_number", { ascending: true }),
    supabase
      .from("tool_logos")
      .select("tool, logo_url"),
    supabase
      .from("fluency_tools")
      .select("name, try_url"),
  ]);

  // Fail open (don't gate) if the query errored — e.g. the
  // onboarding_completed_at column doesn't exist yet because the migration
  // hasn't been applied. Only gate when we can positively confirm it's unset.
  if (!onboardingError && onboardingProfile && !onboardingProfile.onboarding_completed_at) redirect("/onboarding");
  if (!activity) redirect("/workflows");

  const { data: progress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("activity_id", id)
    .maybeSingle();

  const toolLogos = rowsToToolLogoMap(logoRows);
  const toolTryUrls = buildToolTryUrlMap(toolRows ?? []);

  return (
    <ActivityViewClient
      profile={profile as any}
      activity={activity as any}
      activitySteps={activitySteps ?? []}
      progress={progress as any}
      toolLogos={toolLogos}
      toolTryUrls={toolTryUrls}
    />
  );
}

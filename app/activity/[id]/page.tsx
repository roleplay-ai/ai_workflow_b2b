import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { userNeedsOnboarding } from "@/lib/auth/onboardingGate";
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

  if (profile && await userNeedsOnboarding(supabase, user.id)) redirect("/onboarding");
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

import { createClient } from "@/lib/supabase/server";
import UpdatesClient from "./UpdatesClient";

export const dynamic = "force-dynamic";

export default async function UpdatesPage() {
  const supabase = await createClient();

  const [{ data: briefs }, { data: videos }] = await Promise.all([
    supabase
      .from("fluency_briefs")
      .select("*, fluency_brief_items(*)")
      .eq("is_active", true)
      .order("published_date", { ascending: false })
      .limit(1),
    supabase
      .from("apply_videos")
      .select("id, title, description, video_url, thumbnail_url, duration, group_name, category_tag")
      .eq("is_published", true)
      .eq("is_featured", true)
      .order("order_index")
      .limit(12),
  ]);

  return (
    <UpdatesClient
      brief={(briefs?.[0] ?? null) as any}
      videos={(videos ?? []) as any}
    />
  );
}

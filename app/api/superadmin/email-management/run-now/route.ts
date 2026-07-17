import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { processScheduledEmails } from "@/lib/emailProcessing";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Manual trigger so superadmins can test sends without waiting for the daily cron. */
export async function POST() {
  const supabase = await createClient();
  const check = await requireSuperadmin(supabase);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const result = await processScheduledEmails();
  return NextResponse.json(result);
}

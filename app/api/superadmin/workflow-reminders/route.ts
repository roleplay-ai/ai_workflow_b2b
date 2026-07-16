import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";

export async function GET() {
  const supabase = await createClient();
  const check = await requireSuperadmin(supabase);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const service = createServiceClient();
  const { data, error } = await service
    .from("workflow_reminder_schedules")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ schedules: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const check = await requireSuperadmin(supabase);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await req.json() as {
    name?: string;
    recipient_ids?: string[];
    day_of_week?: number;
    send_time?: string;
    start_date?: string;
    duration_weeks?: number;
  };

  const name = String(body.name ?? "").trim();
  const recipient_ids = Array.isArray(body.recipient_ids) ? body.recipient_ids : [];
  const day_of_week = Number(body.day_of_week);
  const duration_weeks = Number(body.duration_weeks);

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (recipient_ids.length === 0) return NextResponse.json({ error: "Select at least one recipient" }, { status: 400 });
  if (!Number.isInteger(day_of_week) || day_of_week < 0 || day_of_week > 6) {
    return NextResponse.json({ error: "Invalid day of week" }, { status: 400 });
  }
  if (!body.send_time) return NextResponse.json({ error: "Send time is required" }, { status: 400 });
  if (!body.start_date) return NextResponse.json({ error: "Start date is required" }, { status: 400 });
  if (!Number.isInteger(duration_weeks) || duration_weeks < 1) {
    return NextResponse.json({ error: "Duration must be at least 1 week" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service.from("workflow_reminder_schedules").insert({
    name,
    recipient_ids,
    day_of_week,
    send_time: body.send_time,
    start_date: body.start_date,
    duration_weeks,
    status: "active",
    created_by: check.userId,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ schedule: data });
}

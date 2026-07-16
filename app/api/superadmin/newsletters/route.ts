import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";

export async function GET() {
  const supabase = await createClient();
  const check = await requireSuperadmin(supabase);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const service = createServiceClient();
  const { data, error } = await service.from("newsletters").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ newsletters: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const check = await requireSuperadmin(supabase);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await req.json() as {
    title?: string;
    subject?: string;
    brief_id?: string | null;
    item_ids?: string[];
    workflow_ids?: string[];
    recipient_ids?: string[];
    send_date?: string;
    send_time?: string;
  };

  const title = String(body.title ?? "").trim();
  const subject = String(body.subject ?? "").trim();
  const item_ids = Array.isArray(body.item_ids) ? body.item_ids : [];
  const workflow_ids = Array.isArray(body.workflow_ids) ? body.workflow_ids : [];
  const recipient_ids = Array.isArray(body.recipient_ids) ? body.recipient_ids : [];

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!subject) return NextResponse.json({ error: "Subject is required" }, { status: 400 });
  if (item_ids.length === 0 && workflow_ids.length === 0) {
    return NextResponse.json({ error: "Select at least one news item or workflow" }, { status: 400 });
  }
  if (recipient_ids.length === 0) return NextResponse.json({ error: "Select at least one recipient" }, { status: 400 });
  if (!body.send_date) return NextResponse.json({ error: "Send date is required" }, { status: 400 });
  if (!body.send_time) return NextResponse.json({ error: "Send time is required" }, { status: 400 });

  const service = createServiceClient();
  const { data, error } = await service.from("newsletters").insert({
    title,
    subject,
    brief_id: body.brief_id ?? null,
    item_ids,
    workflow_ids,
    recipient_ids,
    send_date: body.send_date,
    send_time: body.send_time,
    status: "scheduled",
    created_by: check.userId,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ newsletter: data });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { sendNewsletterNow } from "@/lib/emailProcessing";

export const maxDuration = 60;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const check = await requireSuperadmin(supabase);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await req.json() as { action?: string };

  if (body.action === "send_now") {
    const result = await sendNewsletterNow(id);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, sent: result.sent, failed: result.failed });
  }

  if (body.action !== "cancel") return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  const service = createServiceClient();
  const { data: existing } = await service.from("newsletters").select("status").eq("id", id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
  if (existing.status !== "scheduled") {
    return NextResponse.json({ error: "Only scheduled newsletters can be cancelled" }, { status: 400 });
  }

  const { error } = await service.from("newsletters").update({ status: "cancelled" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

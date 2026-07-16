import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { FluencyEntityType } from "@/lib/supabase/types";

const VALID_TYPES: FluencyEntityType[] = [
  "video",
  "tool",
  "tool_guide",
  "deep_dive",
  "module",
  "page",
];

function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const entityType = body.entityType as FluencyEntityType | undefined;
  const entityId = body.entityId as string | undefined;
  const sessionId = body.sessionId as string | undefined;

  if (!entityType || !entityId || !sessionId || !VALID_TYPES.includes(entityType)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const admin = createServiceClient();
    const { error } = await admin.from("fluency_views").insert({
      entity_type: entityType,
      entity_id: entityId,
      session_id: sessionId,
      user_id: user?.id ?? null,
      ip_address: clientIp(req),
    });
    if (error) {
      console.error("fluency_views insert failed:", error.message);
    }
  } catch (err) {
    console.error("fluency_views insert threw:", err);
  }

  return NextResponse.json({ ok: true });
}

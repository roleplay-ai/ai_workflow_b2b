import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { sessionId } = await req.json().catch(() => ({ sessionId: null }));
  if (!sessionId || !id) return NextResponse.json({ ok: false });

  // Resolve the signed-in user from cookies, then write with the service
  // role so RLS cannot drop user_id (the previous RPC path was missing).
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const admin = createServiceClient();
    const { error } = await admin.from("activity_views").insert({
      activity_id: id,
      session_id: sessionId,
      user_id: user?.id ?? null,
      ip_address: clientIp(req),
    });
    if (error) {
      console.error("activity_views insert failed:", error.message);
    }
  } catch (err) {
    console.error("activity_views insert threw:", err);
  }

  return NextResponse.json({ ok: true });
}

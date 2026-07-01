import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { sessionId } = await req.json().catch(() => ({ sessionId: null }));
  if (!sessionId || !id) return NextResponse.json({ ok: false });

  const supabase = await createClient();
  await supabase.rpc("increment_activity_view", { p_activity_id: id, p_session_id: sessionId }).then(() => null, () => null);

  return NextResponse.json({ ok: true });
}

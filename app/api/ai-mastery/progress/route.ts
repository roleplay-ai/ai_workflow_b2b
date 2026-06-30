import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getValidModuleIds } from "@/lib/ai-mastery-course";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const moduleId = body?.moduleId as string | undefined;

  if (!moduleId || !getValidModuleIds().has(moduleId)) {
    return NextResponse.json({ error: "Invalid module ID" }, { status: 400 });
  }

  const { error } = await supabase
    .from("ai_mastery_progress")
    .upsert({ user_id: user.id, module_id: moduleId }, { onConflict: "user_id,module_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const moduleId = body?.moduleId as string | undefined;

  if (!moduleId || !getValidModuleIds().has(moduleId)) {
    return NextResponse.json({ error: "Invalid module ID" }, { status: 400 });
  }

  await supabase
    .from("ai_mastery_progress")
    .delete()
    .eq("user_id", user.id)
    .eq("module_id", moduleId);

  return NextResponse.json({ ok: true });
}

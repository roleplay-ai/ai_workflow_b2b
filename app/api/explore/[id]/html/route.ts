import { createClient } from "@/lib/supabase/server";
import { DEEP_DIVE_PAGES_BUCKET } from "@/lib/deepDives";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  let query = supabase.from("tool_deep_dives").select("html_path, link_type, published").eq("id", id);
  if (profile?.role !== "superadmin") {
    query = query.eq("published", true);
  }

  const { data: item } = await query.single();
  if (!item || item.link_type !== "html" || !item.html_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: file, error } = await supabase.storage
    .from(DEEP_DIVE_PAGES_BUCKET)
    .download(item.html_path);

  if (error || !file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const html = await file.text();

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-cache",
    },
  });
}

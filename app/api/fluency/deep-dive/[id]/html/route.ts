import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const BUCKET = "deep-dive-pages";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: dive } = await supabase
    .from("tool_deep_dives")
    .select("html_path")
    .eq("id", id)
    .single();

  if (!dive?.html_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let html: string | null = null;
  const { data: file, error } = await supabase.storage
    .from(BUCKET)
    .download(dive.html_path);

  if (file && !error) {
    html = await file.text();
  } else {
    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(dive.html_path, 60);

    if (signErr || !signed?.signedUrl) {
      return NextResponse.json(
        { error: "File not found", detail: error?.message ?? signErr?.message },
        { status: 404 },
      );
    }

    const res = await fetch(signed.signedUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    html = await res.text();
  }

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-cache",
    },
  });
}

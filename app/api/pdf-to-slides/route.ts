import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { convertPdfToImages } from "@/lib/pdfToImages";

export const maxDuration = 60; // allow up to 60s for large PDFs

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const pdfFile   = formData.get("pdf")        as File   | null;
    const activityId = formData.get("activityId") as string | null;

    if (!pdfFile || !activityId) {
      return NextResponse.json({ error: "Missing pdf or activityId" }, { status: 400 });
    }

    // Convert PDF pages → PNG buffers (server-side, Node.js)
    const pdfBuffer  = Buffer.from(await pdfFile.arrayBuffer());
    const pngBuffers = await convertPdfToImages(pdfBuffer, 3.0);

    // Upload each PNG to Supabase Storage and collect public URLs
    const slides: { url: string; caption: string }[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < pngBuffers.length; i++) {
      const path = `slides/${activityId}/${timestamp}_page_${String(i + 1).padStart(3, "0")}.png`;

      const { error: uploadError } = await supabase.storage
        .from("activity-slides")
        .upload(path, pngBuffers[i], { contentType: "image/png", upsert: true });

      if (uploadError) {
        console.error(`[pdf-to-slides] upload error page ${i + 1}:`, uploadError.message);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("activity-slides")
        .getPublicUrl(path);

      slides.push({ url: publicUrl, caption: `Page ${i + 1}` });
    }

    return NextResponse.json({ slides, total: pngBuffers.length });
  } catch (err: any) {
    console.error("[pdf-to-slides] error:", err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? "Conversion failed" }, { status: 500 });
  }
}

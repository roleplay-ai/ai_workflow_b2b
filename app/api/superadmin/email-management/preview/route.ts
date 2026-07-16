import { NextRequest, NextResponse } from "next/server";
import * as React from "react";
import { render } from "@react-email/render";
import { createClient } from "@/lib/supabase/server";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { NewsletterEmail } from "@/emails/NewsletterEmail";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const check = await requireSuperadmin(supabase);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await req.json() as {
    title?: string;
    newsItems?: { title: string; description: string }[];
    workflowItems?: { title: string; description: string }[];
  };

  const html = await render(
    React.createElement(NewsletterEmail, {
      title: body.title?.trim() || "This week in AI",
      newsItems: body.newsItems ?? [],
      workflowItems: body.workflowItems ?? [],
    }),
  );

  return NextResponse.json({ html });
}

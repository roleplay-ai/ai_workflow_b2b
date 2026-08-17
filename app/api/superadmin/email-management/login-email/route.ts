import { NextRequest, NextResponse } from "next/server";
import * as React from "react";
import { render } from "@react-email/render";
import { LabWelcomeEmail } from "@/emails/LabWelcomeEmail";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { sendEmail } from "@/lib/email";
import {
  LAB_URL,
  buildLabWelcomeSubject,
  buildLabWelcomeText,
  getLabWelcomeAssets,
  getLabWelcomePreviewSources,
} from "@/lib/labWelcomeEmail";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_RECIPIENTS = 100;
const SEND_DELAY_MS = 300;

type LoginEmailProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  initial_password: string | null;
};

function firstName(fullName: string | null) {
  return (fullName ?? "").trim().split(/\s+/)[0] || "there";
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const check = await requireSuperadmin(supabase);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const body = await req.json() as {
    action?: "preview" | "send";
    preview_recipient_id?: string;
    recipient_ids?: string[];
  };

  let service;
  try {
    service = createServiceClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server misconfigured" },
      { status: 500 },
    );
  }

  if (body.action === "preview") {
    if (!body.preview_recipient_id) {
      return NextResponse.json({ error: "Select a user to preview" }, { status: 400 });
    }

    const { data: profile, error } = await service
      .from("profiles")
      .select("id, email, full_name, initial_password")
      .eq("id", body.preview_recipient_id)
      .maybeSingle<LoginEmailProfile>();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!profile?.email || !profile.initial_password) {
      return NextResponse.json({ error: "This user does not have saved login credentials" }, { status: 400 });
    }

    const assets = await getLabWelcomeAssets();
    const html = await render(
      React.createElement(LabWelcomeEmail, {
        firstName: firstName(profile.full_name),
        email: profile.email,
        password: "••••••••",
        labUrl: LAB_URL,
        ...getLabWelcomePreviewSources(assets),
      }),
    );

    return NextResponse.json({
      html,
      subject: buildLabWelcomeSubject(firstName(profile.full_name)),
      note: "The saved password is hidden in preview and inserted only when the email is sent.",
    });
  }

  if (body.action !== "send") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const recipientIds = Array.from(new Set(body.recipient_ids ?? [])).filter(Boolean);
  if (recipientIds.length === 0) {
    return NextResponse.json({ error: "Select at least one user" }, { status: 400 });
  }
  if (recipientIds.length > MAX_RECIPIENTS) {
    return NextResponse.json({ error: `Select no more than ${MAX_RECIPIENTS} users at a time` }, { status: 400 });
  }

  const { data, error } = await service
    .from("profiles")
    .select("id, email, full_name, initial_password")
    .in("id", recipientIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const profileById = new Map((data as LoginEmailProfile[] | null ?? []).map(profile => [profile.id, profile]));
  const assets = await getLabWelcomeAssets();
  const attachments = assets.map(({ filename, content, contentId }) => ({ filename, content, contentId }));
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const recipientId of recipientIds) {
    const profile = profileById.get(recipientId);
    if (!profile?.email || !profile.initial_password) {
      skipped++;
      continue;
    }

    const name = firstName(profile.full_name);
    const result = await sendEmail({
      to: profile.email,
      subject: buildLabWelcomeSubject(name),
      react: React.createElement(LabWelcomeEmail, {
        firstName: name,
        email: profile.email,
        password: profile.initial_password,
        labUrl: LAB_URL,
      }),
      text: buildLabWelcomeText({ firstName: name, email: profile.email, password: profile.initial_password }),
      attachments,
    });

    if (result.success) {
      sent++;
      await service
        .from("profiles")
        .update({ welcome_email_sent_at: new Date().toISOString() })
        .eq("id", recipientId);
    } else {
      failed++;
    }

    await delay(SEND_DELAY_MS);
  }

  return NextResponse.json({ sent, failed, skipped, total: recipientIds.length });
}

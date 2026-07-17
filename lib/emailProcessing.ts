import * as React from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/admin";
import { sendEmail, type SendEmailResult } from "@/lib/email";
import { getReminderWorkflows } from "@/lib/workflowReminder";
import { NewsletterEmail } from "@/emails/NewsletterEmail";
import { WorkflowReminderEmail } from "@/emails/WorkflowReminderEmail";

const SEND_DELAY_MS = 300;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const SCHEDULING_TIMEZONE = "Asia/Kolkata";
const IST_WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Today's date and day-of-week as seen in IST, regardless of the server's own runtime timezone. */
function todayParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SCHEDULING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const byType: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") byType[p.type] = p.value;

  return {
    isoDate: `${byType.year}-${byType.month}-${byType.day}`,
    dayOfWeek: IST_WEEKDAY_INDEX[byType.weekday],
  };
}

async function fetchProfileMap(supabase: SupabaseClient, ids: string[]) {
  const map: Record<string, { email: string; full_name: string | null }> = {};
  if (ids.length === 0) return map;
  const { data } = await supabase.from("profiles").select("id, email, full_name").in("id", ids);
  for (const p of data ?? []) {
    if (p.email) map[p.id] = { email: p.email, full_name: p.full_name };
  }
  return map;
}

async function logEmailSend(
  supabase: SupabaseClient,
  sourceType: "newsletter" | "workflow_reminder",
  sourceId: string,
  recipientId: string,
  email: string,
  result: SendEmailResult,
  workflowIds?: string[],
) {
  await supabase.from("email_sends").insert({
    source_type: sourceType,
    source_id: sourceId,
    recipient_id: recipientId,
    email,
    status: result.success ? "sent" : "failed",
    error_message: result.success ? null : result.error,
    workflow_ids: workflowIds ?? null,
  });
}

async function fetchNewsletterContent(supabase: SupabaseClient, newsletter: any) {
  const [{ data: items }, { data: workflows }] = await Promise.all([
    newsletter.item_ids?.length
      ? supabase.from("fluency_brief_items").select("id, content").in("id", newsletter.item_ids)
      : Promise.resolve({ data: [] as { id: string; content: string }[] }),
    newsletter.workflow_ids?.length
      ? supabase.from("activities").select("id, title, description").in("id", newsletter.workflow_ids)
      : Promise.resolve({ data: [] as { id: string; title: string; description: string | null }[] }),
  ]);

  const newsItems = (items ?? []).map((it: any) => {
    const cleaned = String(it.content ?? "").replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, "").trim();
    const colonIdx = cleaned.indexOf(": ");
    return colonIdx > 0
      ? { title: cleaned.slice(0, colonIdx).trim(), description: cleaned.slice(colonIdx + 2).trim() }
      : { title: cleaned, description: "" };
  });

  const workflowItems = (workflows ?? []).map((w: any) => ({ title: w.title, description: w.description ?? "" }));

  return { newsItems, workflowItems };
}

function buildNewsletterSubject(fullName: string | null, subjectLine: string) {
  const firstName = (fullName ?? "").trim().split(" ")[0] || "there";
  return `Hi ${firstName} — ${subjectLine}`;
}

async function sendNewsletterRow(supabase: SupabaseClient, newsletter: any): Promise<{ sent: number; failed: number }> {
  const { newsItems, workflowItems } = await fetchNewsletterContent(supabase, newsletter);
  const profileMap = await fetchProfileMap(supabase, newsletter.recipient_ids ?? []);

  let sent = 0;
  let failed = 0;

  for (const recipientId of newsletter.recipient_ids ?? []) {
    const profile = profileMap[recipientId];
    if (!profile) continue;

    const sendResult = await sendEmail({
      to: profile.email,
      subject: buildNewsletterSubject(profile.full_name, newsletter.subject || newsletter.title),
      react: React.createElement(NewsletterEmail, { title: newsletter.title, newsItems, workflowItems }),
    });
    await logEmailSend(supabase, "newsletter", newsletter.id, recipientId, profile.email, sendResult);
    if (sendResult.success) sent++; else failed++;
    await delay(SEND_DELAY_MS);
  }

  await supabase.from("newsletters").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", newsletter.id);
  return { sent, failed };
}

export type SendNewsletterNowResult =
  | { success: true; sent: number; failed: number }
  | { success: false; error: string };

/** Sends one specific newsletter immediately, bypassing its scheduled send_date. */
export async function sendNewsletterNow(newsletterId: string): Promise<SendNewsletterNowResult> {
  const supabase = createServiceClient();
  const { data: newsletter, error } = await supabase.from("newsletters").select("*").eq("id", newsletterId).maybeSingle();
  if (error) return { success: false, error: error.message };
  if (!newsletter) return { success: false, error: "Newsletter not found" };
  if (newsletter.status !== "scheduled") return { success: false, error: "Only scheduled newsletters can be sent" };

  const { sent, failed } = await sendNewsletterRow(supabase, newsletter);
  return { success: true, sent, failed };
}

export type ProcessResult = {
  newsletters: { processed: number; sent: number; failed: number };
  reminders: { processed: number; sent: number; failed: number };
};

/** Sends everything due today: scheduled newsletters and active reminder schedules whose day matches. */
export async function processScheduledEmails(): Promise<ProcessResult> {
  const supabase = createServiceClient();
  const { isoDate, dayOfWeek } = todayParts();

  const result: ProcessResult = {
    newsletters: { processed: 0, sent: 0, failed: 0 },
    reminders: { processed: 0, sent: 0, failed: 0 },
  };

  const { data: dueNewsletters } = await supabase
    .from("newsletters")
    .select("*")
    .eq("status", "scheduled")
    .lte("send_date", isoDate);

  for (const newsletter of dueNewsletters ?? []) {
    result.newsletters.processed++;
    const { sent, failed } = await sendNewsletterRow(supabase, newsletter);
    result.newsletters.sent += sent;
    result.newsletters.failed += failed;
  }

  const { data: dueSchedules } = await supabase
    .from("workflow_reminder_schedules")
    .select("*")
    .eq("status", "active")
    .eq("day_of_week", dayOfWeek)
    .lte("start_date", isoDate);

  for (const schedule of dueSchedules ?? []) {
    if (schedule.last_sent_date === isoDate) continue;
    if (schedule.sends_completed >= schedule.duration_weeks) continue;

    result.reminders.processed++;
    const profileMap = await fetchProfileMap(supabase, schedule.recipient_ids ?? []);

    for (const recipientId of schedule.recipient_ids ?? []) {
      const profile = profileMap[recipientId];
      if (!profile) continue;

      const workflows = await getReminderWorkflows(supabase, recipientId, 3);
      if (workflows.length === 0) continue;

      const sendResult = await sendEmail({
        to: profile.email,
        subject: "A few workflows are waiting for you",
        react: React.createElement(WorkflowReminderEmail, {
          firstName: (profile.full_name ?? "").split(" ")[0] ?? "",
          workflows: workflows.map(w => ({ title: w.title, description: w.description ?? "" })),
        }),
      });
      await logEmailSend(supabase, "workflow_reminder", schedule.id, recipientId, profile.email, sendResult, workflows.map(w => w.id));
      if (sendResult.success) result.reminders.sent++; else result.reminders.failed++;
      await delay(SEND_DELAY_MS);
    }

    const sendsCompleted = schedule.sends_completed + 1;
    await supabase.from("workflow_reminder_schedules").update({
      sends_completed: sendsCompleted,
      last_sent_date: isoDate,
      status: sendsCompleted >= schedule.duration_weeks ? "completed" : "active",
    }).eq("id", schedule.id);
  }

  return result;
}

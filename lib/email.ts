import * as React from "react";
import { Resend } from "resend";

export const EMAIL_FROM = "Team Nudgeable <team@nudgeable.app>";
export const EMAIL_REPLY_TO = "team@nudgeable.app";

export type SendEmailArgs = {
  to: string;
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
};

export type SendEmailResult = { success: true } | { success: false; error: string };

/** Thin Resend wrapper — the first in-app (route handler) sender; scripts/send-lab-welcome.tsx predates this. */
export async function sendEmail({ to, subject, react, replyTo = EMAIL_REPLY_TO }: SendEmailArgs): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: "Missing RESEND_API_KEY" };

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from: EMAIL_FROM, to, replyTo, subject, react });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

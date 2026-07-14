/**
 * Send AI Practice Lab welcome emails via Resend (React Email).
 *
 * Usage:
 *   npx tsx scripts/send-lab-welcome.tsx --test
 *   npx tsx scripts/send-lab-welcome.tsx --test --to hitanshutandon8@gmail.com
 *   npx tsx scripts/send-lab-welcome.tsx --from-db --company hiranandani
 *   npx tsx scripts/send-lab-welcome.tsx --from-db --pending
 *   npx tsx scripts/send-lab-welcome.tsx --file scripts/output/hiranandani-lab-credentials.xlsx
 *   npx tsx scripts/send-lab-welcome.tsx --file ... --dry-run
 *
 * Subject: "Hi, {name} — Welcome to the AI Practice Lab"
 * Passwords come from profiles.initial_password (--test and --from-db).
 */

import * as React from "react";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { LabWelcomeEmail } from "../emails/LabWelcomeEmail";
import {
  makeBoltIconGif,
  makeCoachIconGif,
  makeFooterDotsGif,
  makeLogoNudgeGif,
  makeProgressIconGif,
} from "./lib/email-assets";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return {} as Record<string, string>;
  return Object.fromEntries(
    fs
      .readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
}

const env = loadEnv();
const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("Missing RESEND_API_KEY in .env.local");
  process.exit(1);
}

function getServiceClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const LAB_URL = "https://work.nudgeable.app/";
const LOGO_PATH = path.join(root, "public", "nudgeable-logo.png");
const FROM = "Team Nudgeable <team@nudgeable.app>";
const REPLY_TO = "team@nudgeable.app";

function buildSubject(firstName: string) {
  const name = String(firstName || "there").trim() || "there";
  return `Hi, ${name} — Welcome to the AI Practice Lab`;
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const isTest = args.includes("--test");
const fromDb = args.includes("--from-db");
const pendingOnly = args.includes("--pending");
const fileIdx = args.indexOf("--file");
const filePath = fileIdx >= 0 ? args[fileIdx + 1] : null;
const companyIdx = args.indexOf("--company");
const companyFilter = companyIdx >= 0 ? args[companyIdx + 1] : null;

type Recipient = {
  id?: string;
  first_name: string;
  email: string;
  password: string;
};

function buildText({ firstName, email, password }: { firstName: string; email: string; password: string }) {
  return `Hi ${firstName},

Welcome to the AI Practice Lab, a space designed to help you build practical AI skills through guided learning and regular practice.

Your login details

Lab URL: ${LAB_URL}
Username: ${email}
Password: ${password}

Please use a laptop or desktop for the best experience.

Inside the AI Practice Lab, you will find:

* Practical AI workflows, an AI Mastery Course, and weekly curated AI updates
* A trained AI Coach to guide you whenever you are stuck
* A personal progress tracker with points, badges, streaks, and leaderboards

For any login or technical issues, simply reply to this email and our team will assist you.

Your access to the AI Practice Lab will remain active for the next three months.

Regards,
Team Nudgeable
team@nudgeable.app`;
}

async function loadRecipientsFromDb(): Promise<Recipient[]> {
  const sb = getServiceClient();

  let companyId: string | null = null;
  if (companyFilter) {
    const looksLikeUuid = /^[0-9a-f-]{36}$/i.test(companyFilter);
    const { data: company, error: cErr } = looksLikeUuid
      ? await sb.from("companies").select("id, name").eq("id", companyFilter).maybeSingle()
      : await sb.from("companies").select("id, name").ilike("name", `%${companyFilter}%`).maybeSingle();

    if (cErr || !company) {
      console.error("Company not found for --company", companyFilter, cErr?.message ?? "");
      process.exit(1);
    }
    companyId = company.id;
    console.log("Company filter:", company.name, company.id);
  }

  let query = sb
    .from("profiles")
    .select("id, email, full_name, initial_password, welcome_email_sent_at, company_id")
    .not("initial_password", "is", null)
    .neq("initial_password", "");

  if (companyId) query = query.eq("company_id", companyId);
  if (pendingOnly) query = query.is("welcome_email_sent_at", null);

  const { data, error } = await query.order("email");
  if (error) {
    console.error("Failed to load profiles:", error.message);
    process.exit(1);
  }

  return (data ?? [])
    .filter((r) => r.email && r.initial_password)
    .map((r) => ({
      id: r.id,
      first_name: (r.full_name ?? "").trim().split(/\s+/)[0] || "there",
      email: String(r.email).trim().toLowerCase(),
      password: String(r.initial_password).trim(),
    }));
}

async function persistPasswordsFromFile(recipients: Recipient[]) {
  if (recipients.length === 0) return;
  const sb = getServiceClient();
  let saved = 0;
  for (const r of recipients) {
    const { data, error } = await sb
      .from("profiles")
      .update({ initial_password: r.password })
      .eq("email", r.email)
      .select("id")
      .maybeSingle();
    if (error) {
      console.warn("Could not save password for", r.email, error.message);
      continue;
    }
    if (data) {
      saved++;
      r.id = data.id;
    } else {
      console.warn("No profile found for", r.email, "(password not saved)");
    }
  }
  console.log(`Saved ${saved}/${recipients.length} passwords to profiles.initial_password`);
}

async function loadRecipients(): Promise<Recipient[]> {
  if (isTest) {
    const toIdx = args.indexOf("--to");
    const toList =
      toIdx >= 0
        ? args[toIdx + 1].split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
        : ["hitanshutandon8@gmail.com"];

    const nameByEmail: Record<string, string> = {
      "hitanshutandon8@gmail.com": "Hitanshu",
      "egauravpatel@gmail.com": "Gaurav",
      "roleplayai8@gmail.com": "Team",
    };

    const sb = getServiceClient();
    const results: Recipient[] = [];
    for (const email of toList) {
      const { data: profile } = await sb
        .from("profiles")
        .select("id, email, full_name, initial_password")
        .eq("email", email)
        .maybeSingle();

      const password = profile?.initial_password?.trim();
      if (!password) {
        console.error(
          `No initial_password in DB for ${email}. Save one first (create users or --file), then retry.`
        );
        process.exit(1);
      }

      const first_name =
        (profile?.full_name ?? "").trim().split(/\s+/)[0] ||
        nameByEmail[email] ||
        email.split("@")[0];

      results.push({
        id: profile?.id,
        first_name,
        email,
        password,
      });
    }
    return results;
  }

  if (fromDb) {
    return loadRecipientsFromDb();
  }

  if (!filePath) {
    console.error("Provide --test, --from-db, or --file <path-to-xlsx>");
    process.exit(1);
  }

  const abs = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
  if (!fs.existsSync(abs)) {
    console.error("File not found:", abs);
    process.exit(1);
  }

  const wb = XLSX.readFile(abs);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const recipients: Recipient[] = rows
    .map((r) => ({
      first_name: String(r.first_name ?? r.firstName ?? "").trim() || "there",
      email: String(r.email ?? "").trim().toLowerCase(),
      password: String(r.password ?? "").trim(),
    }))
    .filter((r) => r.email && r.password);

  await persistPasswordsFromFile(recipients);
  return recipients;
}

if (!fs.existsSync(LOGO_PATH)) {
  console.error("Missing logo at", LOGO_PATH);
  process.exit(1);
}

async function buildAttachments() {
  const logoPng = fs.readFileSync(LOGO_PATH);
  const [logoNudge, bolt, coach, progress, dots] = await Promise.all([
    makeLogoNudgeGif(logoPng, 56),
    Promise.resolve(makeBoltIconGif(64)),
    Promise.resolve(makeCoachIconGif(64)),
    Promise.resolve(makeProgressIconGif(64)),
    Promise.resolve(makeFooterDotsGif(72, 16)),
  ]);

  return [
    { filename: "nudgeable-logo.png", content: logoPng, contentId: "nudgeable-logo" },
    { filename: "logo-nudge.gif", content: logoNudge, contentId: "logo-nudge" },
    { filename: "icon-bolt.gif", content: bolt, contentId: "icon-bolt" },
    { filename: "icon-coach.gif", content: coach, contentId: "icon-coach" },
    { filename: "icon-progress.gif", content: progress, contentId: "icon-progress" },
    { filename: "footer-dots.gif", content: dots, contentId: "footer-dots" },
  ];
}

async function main() {
  const attachments = await buildAttachments();
  const recipients = await loadRecipients();
  console.log(`${dryRun ? "[DRY RUN] " : ""}Preparing to send ${recipients.length} email(s) from ${FROM}`);

  const resend = dryRun ? null : new Resend(apiKey);
  const sbForMarks = dryRun ? null : getServiceClient();
  let ok = 0;
  let fail = 0;

  for (const r of recipients) {
    const subject = buildSubject(r.first_name);
    const payload = {
      from: FROM,
      to: r.email,
      replyTo: REPLY_TO,
      subject,
      react: React.createElement(LabWelcomeEmail, {
        firstName: r.first_name,
        email: r.email,
        password: r.password,
        labUrl: LAB_URL,
        logoCid: "cid:nudgeable-logo",
        logoAnimCid: "cid:logo-nudge",
        iconBoltCid: "cid:icon-bolt",
        iconCoachCid: "cid:icon-coach",
        iconProgressCid: "cid:icon-progress",
        footerDotsCid: "cid:footer-dots",
      }),
      text: buildText({ firstName: r.first_name, email: r.email, password: r.password }),
      attachments,
    };

    if (dryRun) {
      console.log("WOULD SEND →", r.email, `(${r.first_name})`, `[${subject}]`);
      ok++;
      continue;
    }

    try {
      const { data, error } = await resend!.emails.send(payload);
      if (error) {
        fail++;
        console.error("FAIL", r.email, error);
      } else {
        ok++;
        console.log("SENT", r.email, data?.id ?? "");
        if (r.id && sbForMarks) {
          await sbForMarks
            .from("profiles")
            .update({ welcome_email_sent_at: new Date().toISOString() })
            .eq("id", r.id);
        }
      }
    } catch (e: unknown) {
      fail++;
      console.error("FAIL", r.email, e instanceof Error ? e.message : e);
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log("\nDone:", { ok, fail, total: recipients.length });
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

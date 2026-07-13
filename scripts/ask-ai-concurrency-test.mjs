/**
 * Concurrency test: 30 users × 2 Ask AI messages.
 *
 * Wave 1: all 30 users send message 1 at once
 * Wait >3s (minRepeatIntervalMs)
 * Wave 2: all 30 users send message 2 at once
 *
 * Usage: node scripts/ask-ai-concurrency-test.mjs
 * Env: loads .env.local; optional ASK_TEST_BASE_URL (default http://localhost:3000)
 */
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

const USER_COUNT = 30;
const MESSAGES_PER_USER = 2;
const PASSWORD = "LoadTestAskAI!2026";
const EMAIL_DOMAIN = "loadtest.local";
const COOLDOWN_MS = 3200; // ASK_LIMITS.minRepeatIntervalMs is 3000
const REQUEST_TIMEOUT_MS = 180_000;

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvLocal();

const BASE_URL = process.env.ASK_TEST_BASE_URL || "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_KEY) {
  console.error("Missing Supabase env vars in .env.local");
  process.exit(1);
}

const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
const cookieKey = `sb-${projectRef}-auth-token`;
const MAX_CHUNK = 3180;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function createChunks(key, value) {
  let encodedValue = encodeURIComponent(value);
  if (encodedValue.length <= MAX_CHUNK) return [{ name: key, value }];
  const chunks = [];
  while (encodedValue.length > 0) {
    let encodedChunkHead = encodedValue.slice(0, MAX_CHUNK);
    const lastEscapePos = encodedChunkHead.lastIndexOf("%");
    if (lastEscapePos > MAX_CHUNK - 3) {
      encodedChunkHead = encodedChunkHead.slice(0, lastEscapePos);
    }
    let valueHead = "";
    while (encodedChunkHead.length > 0) {
      try {
        valueHead = decodeURIComponent(encodedChunkHead);
        break;
      } catch (error) {
        if (
          error instanceof URIError &&
          encodedChunkHead.at(-3) === "%" &&
          encodedChunkHead.length > 3
        ) {
          encodedChunkHead = encodedChunkHead.slice(0, encodedChunkHead.length - 3);
        } else {
          throw error;
        }
      }
    }
    chunks.push(valueHead);
    encodedValue = encodedValue.slice(encodedChunkHead.length);
  }
  return chunks.map((v, i) => ({ name: `${key}.${i}`, value: v }));
}

function sessionCookieHeader(session) {
  const encoded =
    "base64-" + Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return createChunks(cookieKey, encoded)
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

function emailFor(i) {
  return `askai-load-${String(i).padStart(2, "0")}@${EMAIL_DOMAIN}`;
}

async function ensureUser(email) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: `AskAI Load ${email}` },
  });
  if (!error && data.user) return data.user.id;

  const already =
    error?.message?.toLowerCase().includes("already") ||
    error?.message?.toLowerCase().includes("registered") ||
    error?.status === 422;

  if (!already) throw new Error(`createUser ${email}: ${error?.message}`);

  const { data: profile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!profile?.id) {
    // Fallback: page through auth users (small load-test set)
    for (let page = 1; page <= 5; page++) {
      const { data: listed } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      const found = listed?.users?.find((u) => u.email === email);
      if (found) {
        await admin.auth.admin.updateUserById(found.id, { password: PASSWORD, email_confirm: true });
        return found.id;
      }
      if (!listed?.users?.length) break;
    }
    throw new Error(`User exists but could not resolve id for ${email}`);
  }

  await admin.auth.admin.updateUserById(profile.id, { password: PASSWORD, email_confirm: true });
  return profile.id;
}

async function signIn(email) {
  const { data, error } = await anon.auth.signInWithPassword({ email, password: PASSWORD });
  if (error || !data.session) throw new Error(`signIn ${email}: ${error?.message}`);
  return data.session;
}

async function postAsk(cookie, question, sessionId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body: JSON.stringify({ question, sessionId }),
      signal: controller.signal,
    });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text.slice(0, 200) };
    }
    return {
      ok: res.status === 200 && typeof body?.answer === "string",
      status: res.status,
      ms: Date.now() - started,
      error: body?.error || (res.status !== 200 ? text.slice(0, 120) : undefined),
      answerLen: typeof body?.answer === "string" ? body.answer.length : 0,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      ms: Date.now() - started,
      error: err.name === "AbortError" ? "timeout" : String(err.message || err),
      answerLen: 0,
    };
  } finally {
    clearTimeout(timer);
  }
}

function summarize(label, results) {
  const ok = results.filter((r) => r.ok);
  const fail = results.filter((r) => !r.ok);
  const statuses = {};
  for (const r of results) statuses[r.status] = (statuses[r.status] || 0) + 1;
  const times = results.map((r) => r.ms).sort((a, b) => a - b);
  const pct = (p) => times[Math.min(times.length - 1, Math.floor((p / 100) * times.length))] ?? 0;
  console.log(`\n=== ${label} ===`);
  console.log(`success: ${ok.length}/${results.length}`);
  console.log(`status counts: ${JSON.stringify(statuses)}`);
  console.log(
    `latency ms — min=${times[0] ?? 0} p50=${pct(50)} p95=${pct(95)} max=${times[times.length - 1] ?? 0}`,
  );
  if (fail.length) {
    const samples = fail.slice(0, 8).map((r) => `  user=${r.user} msg=${r.msg} status=${r.status} err=${r.error}`);
    console.log(`failures (sample):\n${samples.join("\n")}`);
  }
  return { ok: ok.length, fail: fail.length, statuses, p50: pct(50), p95: pct(95), max: times[times.length - 1] ?? 0 };
}

async function main() {
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Preparing ${USER_COUNT} users…`);

  // Probe server
  try {
    const probe = await fetch(`${BASE_URL}/login`, { method: "GET" });
    console.log(`Server probe /login → ${probe.status}`);
  } catch (e) {
    console.error(`Server not reachable at ${BASE_URL}: ${e.message}`);
    process.exit(1);
  }

  const users = [];
  for (let i = 1; i <= USER_COUNT; i++) {
    const email = emailFor(i);
    process.stdout.write(`\r  ensure ${i}/${USER_COUNT} ${email}`);
    await ensureUser(email);
    const session = await signIn(email);
    users.push({
      email,
      cookie: sessionCookieHeader(session),
      sessionId: randomUUID(),
    });
  }
  console.log("\nUsers ready. Starting concurrent waves…");

  const questions = [
    "What is AI mastery and how do I get started?",
    "How can AI help with shift planning and work allocation?",
  ];

  const allResults = [];

  for (let msg = 0; msg < MESSAGES_PER_USER; msg++) {
    if (msg > 0) {
      console.log(`Waiting ${COOLDOWN_MS}ms for per-user cooldown…`);
      await new Promise((r) => setTimeout(r, COOLDOWN_MS));
    }
    const question = questions[msg] || `Load test question ${msg + 1} — briefly explain one AI workflow tip.`;
    console.log(`\nWave ${msg + 1}: ${USER_COUNT} concurrent POSTs /api/ask`);
    const waveStart = Date.now();
    const results = await Promise.all(
      users.map(async (u, idx) => {
        const result = await postAsk(u.cookie, question, u.sessionId);
        return { ...result, user: idx + 1, msg: msg + 1, email: u.email };
      }),
    );
    console.log(`Wave ${msg + 1} wall time: ${Date.now() - waveStart}ms`);
    summarize(`Wave ${msg + 1}`, results);
    allResults.push(...results);
  }

  const summary = summarize("ALL (60 requests)", allResults);
  const passed = summary.ok === USER_COUNT * MESSAGES_PER_USER;
  console.log(
    `\nVerdict: ${passed ? "PASS" : "FAIL"} — ${summary.ok}/${USER_COUNT * MESSAGES_PER_USER} messages succeeded under concurrency.`,
  );
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

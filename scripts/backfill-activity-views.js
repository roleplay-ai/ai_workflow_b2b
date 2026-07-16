/**
 * One-time backfill: for user_progress updated in the last 7 days,
 * insert a matching activity_views row when none exists for that user+activity
 * in the same window. Fixes admin engagement charts after view tracking broke.
 *
 * Usage: node scripts/backfill-activity-views.js
 */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const get = (k) => {
  const m = env.match(new RegExp("^" + k + "=(.*)$", "m"));
  return m?.[1]?.trim().replace(/^["']|["']$/g, "");
};

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const key = get("SUPABASE_SERVICE_ROLE_KEY");
const headers = {
  apikey: key,
  Authorization: "Bearer " + key,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function rest(method, pathName, body) {
  const r = await fetch(url + "/rest/v1/" + pathName, {
    method,
    headers: method === "GET" ? { ...headers, Prefer: "count=exact" } : headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: r.status, range: r.headers.get("content-range"), data };
}

(async () => {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceIso = since.toISOString();

  const progress = await rest(
    "GET",
    `user_progress?select=user_id,activity_id,updated_at,completed_at&updated_at=gte.${sinceIso}&order=updated_at.asc&limit=5000`
  );
  if (!Array.isArray(progress.data)) {
    console.error("Failed to load progress", progress);
    process.exit(1);
  }

  const existing = await rest(
    "GET",
    `activity_views?select=user_id,activity_id&user_id=not.is.null&created_at=gte.${sinceIso}&limit=10000`
  );
  const have = new Set(
    (Array.isArray(existing.data) ? existing.data : []).map(
      (v) => `${v.user_id}:${v.activity_id}`
    )
  );

  const toInsert = [];
  const seen = new Set();
  for (const p of progress.data) {
    const key = `${p.user_id}:${p.activity_id}`;
    if (have.has(key) || seen.has(key)) continue;
    seen.add(key);
    toInsert.push({
      activity_id: p.activity_id,
      user_id: p.user_id,
      session_id: `backfill-${p.user_id.slice(0, 8)}`,
      created_at: p.completed_at || p.updated_at,
    });
  }

  console.log(`Progress rows (7d): ${progress.data.length}`);
  console.log(`Existing attributed views (7d): ${have.size}`);
  console.log(`Backfill inserts: ${toInsert.length}`);

  if (!toInsert.length) {
    console.log("Nothing to backfill.");
    return;
  }

  // Batch insert
  const batchSize = 100;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const res = await rest("POST", "activity_views", batch);
    if (res.status >= 300) {
      console.error("Insert failed", res.status, res.data);
      process.exit(1);
    }
    inserted += Array.isArray(res.data) ? res.data.length : batch.length;
  }
  console.log(`Inserted ${inserted} activity_views rows.`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

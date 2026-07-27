/**
 * Register the new "Unique to each" feature tags (added to activities by
 * scripts/seed-tool-feature-tags.mjs) in the activity_tags table, so they
 * show up correctly as existing options in the superadmin tag picker
 * instead of only living on the activity rows themselves.
 *
 * Usage: node scripts/seed-tool-feature-tags-registry.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
const get = (k) => {
  const m = env.match(new RegExp("^" + k + "=(.*)$", "m"));
  return m?.[1]?.trim().replace(/^["']|["']$/g, "");
};

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const key = get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const NEW_TAGS = ["Design", "Dispatch", "Plugins", "Image Generation", "Video Generation", "Scheduled Prompts"];

const headers = {
  apikey: key,
  Authorization: "Bearer " + key,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function rest(method, pathName, body) {
  const r = await fetch(url + "/rest/v1/" + pathName, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: r.status, data };
}

const { data: existing } = await rest("GET", "activity_tags?select=name");
const existingLower = new Set((existing ?? []).map((row) => row.name.toLowerCase()));

for (const name of NEW_TAGS) {
  if (existingLower.has(name.toLowerCase())) {
    console.log(`○ already registered ← ${name}`);
    continue;
  }
  const result = await rest("POST", "activity_tags", { name });
  if (result.status >= 400) {
    console.error("Failed to register", name, result);
    process.exit(1);
  }
  console.log(`✓ registered         ← ${name}`);
}

console.log("\nDone. (No icon uploaded — every other tag in activity_tags has one; add via superadmin > tag icons if you want these to match visually.)");

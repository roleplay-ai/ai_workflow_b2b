/**
 * Add a feature-specific tag to the activities that genuinely match one of the
 * "Unique to each" provider features (e.g. Claude Design, Claude Plugins,
 * Gemini Video Generation), so /workflows?tool=X&tag=Y returns real results
 * from each feature's "Explore workflows" CTA.
 *
 * Appends to the existing tags array — never removes or replaces tags.
 * Only activities with a clear, honest match are tagged; features with no
 * matching real workflow yet (ChatGPT Sites, Claude Tag, Copilot Pages,
 * Copilot Studio Agents) are intentionally left untagged rather than
 * misattributing unrelated content.
 *
 * Usage: node scripts/seed-tool-feature-tags.mjs
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

/** @type {Record<string, string>} activityId → tag to add */
const ASSIGNMENTS = {
  "2f1bc7e1-37fe-41f4-bd84-db8e8b71d38f": "Image Generation", // Generate High Quality Images with PICTURE Prompt (gemini, chatgpt)
  "158da244-4d2a-4370-8824-d6e5b82932bd": "Design", // Design PPTs with Claude
  "85b645d5-c56a-4f94-a568-71a6da9955b5": "Dispatch", // Control Your Laptop from Anywhere with Dispatch
  "cd36540e-fef6-402c-bfb1-d8512c98b6a0": "Plugins", // Activate Claude Plugins for Specialized Tasks
  "e3cfb6ea-bd4d-4efa-a92e-44bc8d8aa28f": "Video Generation", // Generate Videos with Gemini
  "a4e9a78e-bdf9-4345-95f9-f69c2f1ff4fb": "Video Generation", // Turn Slides into Videos with Google Vids
  "ded2706a-b6a2-4321-b6c6-1627b118e1d8": "Video Generation", // Create Video Overviews with NotebookLM
  "018b4e24-5d71-4359-8d43-b78465e64a7f": "Scheduled Prompts", // Use Copilot Cowork to automate daily tasks
};

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

const ids = Object.keys(ASSIGNMENTS);
const { data: activities } = await rest(
  "GET",
  `activities?select=id,title,tags&id=in.(${ids.join(",")})`,
);
if (!Array.isArray(activities)) {
  console.error("Failed to load activities", activities);
  process.exit(1);
}

let updated = 0;
let skipped = 0;

for (const activity of activities) {
  const newTag = ASSIGNMENTS[activity.id];
  const currentTags = activity.tags ?? [];
  if (currentTags.some((t) => t.toLowerCase() === newTag.toLowerCase())) {
    skipped += 1;
    console.log(`○ already tagged   ← ${activity.title}`);
    continue;
  }
  const result = await rest("PATCH", `activities?id=eq.${activity.id}`, {
    tags: [...currentTags, newTag],
  });
  if (result.status >= 400) {
    console.error("Failed to tag", activity.title, result);
    process.exit(1);
  }
  updated += 1;
  console.log(`✓ ${newTag.padEnd(18)} ← ${activity.title}`);
}

console.log("\nDone.");
console.log(`  updated: ${updated}`);
console.log(`  skipped: ${skipped}`);
console.log(`  matched: ${activities.length} / ${ids.length}`);

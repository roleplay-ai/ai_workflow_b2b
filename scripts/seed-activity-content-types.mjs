/**
 * Seed activity content_type values to the Capabilities sidebar labels:
 * Skills, Projects, Vibe coding, Scheduled actions, AI agents, Coding agents.
 *
 * Clears legacy values (chat / build / automate / AI Mastery) from activities
 * that are not in the explicit mapping below.
 *
 * Usage: node scripts/seed-activity-content-types.mjs
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

/** @type {Record<string, string>} activityId → content_type */
const ASSIGNMENTS = {
  // Skills
  "61d8fafc-0190-441a-abc9-6774f25ca702": "Skills", // Build automated workflows with Claude Skills
  "025e6a42-4bbc-4d5f-82e7-47a64651f565": "Skills", // Auto-Generate any Dashboard with Skills
  "cd36540e-fef6-402c-bfb1-d8512c98b6a0": "Skills", // Activate Claude Plugins for Specialized Tasks

  // Projects
  "f8adee41-cfc0-4295-8b5c-64fe47bda3a1": "Projects", // The New Hire Onboarding Hub with Copilot Projects
  "1f2e0991-68a0-4d68-bb74-45777848a2c8": "Projects", // Vendor Evaluation Hub Project in ChatGPT Projects
  "06eaf9ed-0b1b-408d-958b-e3f015ad2701": "Projects", // Organize Work into Claude Projects
  "a77d6d27-1496-44de-bbe5-a9baaa53c7a7": "Projects", // Optimize Work & Save Time with Projects

  // Vibe coding
  "3b383d76-2f25-41f9-91cc-85902811e22b": "Vibe coding", // Vibe Coding with AI
  "b69b405c-40c9-4492-aaf6-faf972418fa2": "Vibe coding", // Build a Website with Lovable
  "517c2b8c-9253-4219-ac6c-5b19619d6e3e": "Vibe coding", // Build and Publish an Interactive App with Artifacts
  "7dc32a59-c0fa-411a-a58f-1d2ae4cdbc0b": "Vibe coding", // Build Live Sales Dashboard with Google AI Studio
  "29364c5b-b83a-4b9e-bc74-d4c66b00b3a6": "Vibe coding", // Build an Android App
  "1202378e-c87f-4a88-8afe-9697702a7b05": "Vibe coding", // Real-Time Text Editing with Gemini Canvas

  // Scheduled actions
  "4b4a8251-e920-450e-8435-08d9dc5702e4": "Scheduled actions", // Schedule Tasks to Run Automatically
  "70e2fb2c-0558-4ef1-a408-d2fc295a571e": "Scheduled actions", // Schedule tasks to run automatically in ChatGPT
  "0717f5fc-6891-42c4-8b92-ab2dbc03652a": "Scheduled actions", // Automate Your Weekly Email Action Items
  "f61b58be-c4f4-4238-ae48-247b86f05d8a": "Scheduled actions", // Automate workflows with Zapier
  "f84115c8-ac57-4c21-a321-f9d912dc5c19": "Scheduled actions", // Automate workflows with ChatGPT
  "6da3cb4e-aab6-45f4-86ac-01887e6a6bdf": "Scheduled actions", // Customer Escalation Automation with Google Workspace Studio
  "018b4e24-5d71-4359-8d43-b78465e64a7f": "Scheduled actions", // Use Copilot Cowork to automate daily tasks

  // AI agents
  "0394ff28-8764-4df9-a0ae-bd37520aaa5d": "AI agents", // Build Voice AI Appointment Booking Agent using Vapi
  "905137ba-712b-478b-b11b-678f5b8b2353": "AI agents", // Build a Chat Agent for your Website Using ChatBase
  "8a7cb602-f98a-4a27-aad2-6b8e5e7aacf3": "AI agents", // Build a Voice Agent using VoiceFlow
  "ce198302-d0f0-47bd-aa72-d31451e86cea": "AI agents", // Build a custom trained chatbot on your data with Botpress
  "85b645d5-c56a-4f94-a568-71a6da9955b5": "AI agents", // Control Your Laptop from Anywhere with Dispatch
  "928c8ea9-7327-4c87-a060-fae1fb572fc3": "AI agents", // Letting Claude Access Your Browser And Take Actions
  "6101b362-2ee6-4f86-a9a2-2ac15814620b": "AI agents", // Train AI on your own voice with ElevenLabs
  "402c33d0-c9cf-404f-b556-4cdbf0f3fbc7": "AI agents", // Running a Copilot Cowork Task on Mobile
  "5a0f9bcc-489f-4be7-b83b-df7a6c810146": "AI agents", // ChatGPT : The new features including Work

  // Coding agents
  "45db04a3-64b6-4444-bfa6-49dd721b37bb": "Coding agents", // ChatGPT Codex: Your AI Software Engineering Agent
};

const CANONICAL = new Set([
  "Skills",
  "Projects",
  "Vibe coding",
  "Scheduled actions",
  "AI agents",
  "Coding agents",
]);

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

const activities = await rest(
  "GET",
  "activities?select=id,title,content_type&order=position",
);
if (!Array.isArray(activities.data)) {
  console.error("Failed to load activities", activities);
  process.exit(1);
}

let assigned = 0;
let cleared = 0;
let skipped = 0;
const counts = {};

for (const activity of activities.data) {
  const nextType = ASSIGNMENTS[activity.id] ?? "";
  const current = activity.content_type ?? "";

  if (nextType) {
    if (current === nextType) {
      skipped += 1;
      counts[nextType] = (counts[nextType] || 0) + 1;
      continue;
    }
    const result = await rest("PATCH", `activities?id=eq.${activity.id}`, {
      content_type: nextType,
    });
    if (result.status >= 400) {
      console.error("Failed to assign", activity.title, result);
      process.exit(1);
    }
    assigned += 1;
    counts[nextType] = (counts[nextType] || 0) + 1;
    console.log(`✓ ${nextType.padEnd(18)} ← ${activity.title}`);
    continue;
  }

  // Remove legacy / non-canonical content types from unrelated activities
  if (current && !CANONICAL.has(current)) {
    const result = await rest("PATCH", `activities?id=eq.${activity.id}`, {
      content_type: "",
    });
    if (result.status >= 400) {
      console.error("Failed to clear", activity.title, result);
      process.exit(1);
    }
    cleared += 1;
    console.log(`○ cleared (${current})     ← ${activity.title}`);
    continue;
  }

  skipped += 1;
  if (current) counts[current] = (counts[current] || 0) + 1;
}

console.log("\nDone.");
console.log(`  assigned: ${assigned}`);
console.log(`  cleared:  ${cleared}`);
console.log(`  skipped:  ${skipped}`);
console.log("  counts:", counts);

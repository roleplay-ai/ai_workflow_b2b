/**
 * Ensure activity-videos bucket is public and configure Storage CORS for video playback.
 *
 * Usage: node scripts/configure-activity-videos-cors.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const env = fs.readFileSync(envPath, "utf8");
const get = (k) => {
  const m = env.match(new RegExp("^" + k + "=(.*)$", "m"));
  return m?.[1]?.trim().replace(/^["']|["']$/g, "");
};

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const key = get("SUPABASE_SERVICE_ROLE_KEY");
const siteUrl = get("NEXT_PUBLIC_SITE_URL");

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const BUCKET = "activity-videos";
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

const allowedOrigins = [
  siteUrl,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

async function api(method, endpoint, body) {
  const res = await fetch(`${url}/storage/v1/${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { ok: res.ok, status: res.status, json };
}

async function main() {
  console.log(`Configuring ${BUCKET} bucket at ${url}…`);

  const getBucket = await api("GET", `bucket/${BUCKET}`);
  if (getBucket.status === 404) {
    const create = await api("POST", "bucket", {
      id: BUCKET,
      name: BUCKET,
      public: true,
      file_size_limit: 524288000,
      allowed_mime_types: ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/mpeg"],
    });
    if (!create.ok) {
      console.error("Failed to create bucket:", create.status, create.json);
      process.exit(1);
    }
    console.log("✓ Created bucket");
  } else if (!getBucket.ok) {
    console.error("Failed to read bucket:", getBucket.status, getBucket.json);
    process.exit(1);
  } else {
    console.log("Bucket exists:", { public: getBucket.json?.public, allowed_mime_types: getBucket.json?.allowed_mime_types });
  }

  const update = await api("PUT", `bucket/${BUCKET}`, {
    public: true,
    file_size_limit: 524288000,
    allowed_mime_types: ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/mpeg"],
  });
  if (!update.ok) {
    console.error("Failed to update bucket:", update.status, update.json);
    process.exit(1);
  }
  console.log("✓ Bucket set to public with video MIME types");

  const corsBody = {
    allowed_origins: allowedOrigins.length ? allowedOrigins : ["*"],
    allowed_methods: ["GET", "HEAD", "OPTIONS"],
    allowed_headers: ["*"],
    exposed_headers: ["Content-Range", "Accept-Ranges", "Content-Length", "Content-Type"],
    max_age: 3600,
  };

  const cors = await api("POST", "cors", corsBody);
  if (cors.ok) {
    console.log("✓ Storage CORS configured:", corsBody.allowed_origins);
  } else {
    // Hosted Supabase may handle CORS at the gateway; bucket public + RLS is the critical part.
    console.warn("Storage CORS endpoint returned", cors.status, "(may be expected on hosted Supabase):", cors.json);
    console.log("Apply supabase/migrations/20260729_activity_videos_bucket.sql if bucket policies are missing.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

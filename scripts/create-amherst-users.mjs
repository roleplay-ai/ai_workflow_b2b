import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const excelPath =
  process.argv[2] || path.join(process.env.USERPROFILE || "", "Downloads", "Amherst Users.xlsx");

if (!fs.existsSync(excelPath)) {
  console.error("Excel file not found:", excelPath);
  console.error("Usage: node scripts/create-amherst-users.mjs [path-to-xlsx]");
  process.exit(1);
}

const workbook = XLSX.readFile(excelPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

const users = rawRows
  .map((row) => {
    const firstName = String(row["FIRST NAME"] || row["First Name"] || row.first_name || "").trim();
    const email = String(row["Email ID"] || row["Email"] || row.email || "").trim();
    if (!firstName || !email) return null;
    return { full_name: firstName, email };
  })
  .filter(Boolean);

if (users.length === 0) {
  console.error("No users found in", excelPath);
  process.exit(1);
}

console.log(`Loaded ${users.length} users from`, excelPath);

function randomPassword(len = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

const outDir = path.join(__dirname, "output");
fs.mkdirSync(outDir, { recursive: true });

let companyId;
const { data: existingCompany } = await sb
  .from("companies")
  .select("id, name")
  .or("name.ilike.%amherst%,domain.ilike.%amherst%")
  .maybeSingle();

if (existingCompany) {
  companyId = existingCompany.id;
  console.log("Using existing company:", existingCompany.name, companyId);
} else {
  const { data: created, error: cErr } = await sb
    .from("companies")
    .insert({ name: "Amherst", domain: "amherst.com" })
    .select("id, name")
    .single();
  if (cErr) {
    console.error("Failed to create company:", cErr);
    process.exit(1);
  }
  companyId = created.id;
  console.log("Created company:", created.name, companyId);
}

const rows = [];
const results = [];

for (const u of users) {
  const email = u.email.trim().toLowerCase();
  const first_name = u.full_name.split(" ")[0];
  const password = randomPassword(6);

  const { data: existing } = await sb
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    const { error: updErr } = await sb.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name },
    });
    if (updErr) {
      results.push({ email, status: "error", message: updErr.message });
      console.log("ERROR update", email, updErr.message);
      continue;
    }
    await sb
      .from("profiles")
      .update({
        company_id: companyId,
        full_name: u.full_name,
        initial_password: password,
      })
      .eq("id", existing.id);
    rows.push({ first_name, full_name: u.full_name, email, password });
    results.push({ email, status: "updated" });
    console.log("UPDATED", email);
    continue;
  }

  const { data: authUser, error: authError } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: u.full_name },
  });

  if (authError) {
    results.push({ email, status: "error", message: authError.message });
    console.log("ERROR create", email, authError.message);
    continue;
  }

  if (authUser?.user) {
    await sb
      .from("profiles")
      .update({
        company_id: companyId,
        full_name: u.full_name,
        initial_password: password,
      })
      .eq("id", authUser.user.id);
  }

  rows.push({ first_name, full_name: u.full_name, email, password });
  results.push({ email, status: "created" });
  console.log("CREATED", email);
}

const sheetRows = rows.map((r) => ({
  first_name: r.first_name,
  full_name: r.full_name,
  email: r.email,
  password: r.password,
}));

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(sheetRows);
ws["!cols"] = [{ wch: 14 }, { wch: 22 }, { wch: 42 }, { wch: 12 }];
XLSX.utils.book_append_sheet(wb, ws, "Credentials");
const outPath = path.join(outDir, "amherst-lab-credentials.xlsx");
XLSX.writeFile(wb, outPath);

console.log("\nSummary:", {
  created: results.filter((r) => r.status === "created").length,
  updated: results.filter((r) => r.status === "updated").length,
  errors: results.filter((r) => r.status === "error").length,
  excel: outPath,
  passwords_saved_to_db: sheetRows.length,
  passwords_saved_to_excel: sheetRows.length,
});

if (results.some((r) => r.status === "error")) {
  console.log("Errors:", results.filter((r) => r.status === "error"));
  process.exit(1);
}

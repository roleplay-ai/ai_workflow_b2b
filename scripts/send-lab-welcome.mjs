/**
 * Thin wrapper — runs the React Email sender.
 * Prefer: npx tsx scripts/send-lab-welcome.tsx …
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(__dirname, "send-lab-welcome.tsx");
const result = spawnSync("npx", ["tsx", script, ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  cwd: path.join(__dirname, ".."),
});
process.exit(result.status ?? 1);

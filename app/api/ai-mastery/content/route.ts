import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

function buildPreInitScript(completedJson: string): string {
  return `<script>
(function(){
  try {
    localStorage.setItem('aiMasteryFinalCompleted', '${completedJson}');
  } catch(e) {}
})();
</script>
`;
}

const BRIDGE_SCRIPT = `
<script>
(function(){
  var _orig = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(k, v) {
    _orig(k, v);
    if (k === 'aiMasteryFinalCompleted') {
      try { window.parent.postMessage({ type: 'ai-mastery-progress', completedModules: JSON.parse(v) }, '*'); } catch(e) {}
    }
  };
})();
</script>
`;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let completedModules: string[] = [];
  if (user) {
    const { data: rows } = await supabase
      .from("ai_mastery_progress")
      .select("module_id")
      .eq("user_id", user.id);
    completedModules = (rows ?? []).map(r => r.module_id as string);
  }
  const completedJson = JSON.stringify(completedModules).replace(/'/g, "\\'");

  let html: string;
  try {
    const filePath = path.join(process.cwd(), "assets", "ai-mastery-course.html");
    html = await readFile(filePath, "utf-8");
  } catch {
    return new NextResponse("Course content unavailable.", { status: 404 });
  }

  const scriptStart = "<script>\nconst modules = [";
  html = html.replace(scriptStart, buildPreInitScript(completedJson) + scriptStart);
  html = html.replace("</body>", BRIDGE_SCRIPT + "\n</body>");

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-cache",
    },
  });
}

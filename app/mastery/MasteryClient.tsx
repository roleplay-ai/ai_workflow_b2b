"use client";

import { useRef, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TOTAL_MODULES } from "@/lib/ai-mastery-course";

type Props = {
  completedModules: string[];
  userName: string | null;
};

export default function MasteryClient({ completedModules: initial, userName }: Props) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [completed, setCompleted] = useState<string[]>(initial);
  const [saving, startSave] = useTransition();
  const prevRef = useRef<Set<string>>(new Set(initial));

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type !== "ai-mastery-progress") return;
      const incoming: string[] = e.data.completedModules ?? [];
      const added = incoming.filter(id => !prevRef.current.has(id));
      const removed = [...prevRef.current].filter(id => !incoming.includes(id));
      setCompleted(incoming);
      prevRef.current = new Set(incoming);
      startSave(async () => {
        await Promise.all([
          ...added.map(id =>
            fetch("/api/ai-mastery/progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ moduleId: id }),
            })
          ),
          ...removed.map(id =>
            fetch("/api/ai-mastery/progress", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ moduleId: id }),
            })
          ),
        ]);
      });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const pct = Math.round((completed.length / TOTAL_MODULES) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "#FEFCFA" }}>

      {/* Top bar */}
      <div style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", height: 52,
        background: "#fff", borderBottom: "1px solid #E8DFD2",
        gap: 16,
      }}>
        {/* Left: back + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/workflows")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12.5, fontWeight: 700, color: "#746F78",
              background: "none", border: "none", cursor: "pointer",
              padding: "6px 10px", borderRadius: 7,
              fontFamily: "inherit",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F5F3EF"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 2L4 7l5 5" />
            </svg>
            Back
          </button>
          <div style={{ width: 1, height: 18, background: "#E9E4DC" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 22, height: 22, borderRadius: 6,
              background: "#FFCE00", border: "1.5px solid #221D23",
              display: "grid", placeItems: "center",
              fontSize: 11, fontWeight: 900,
            }}>N</span>
            <span style={{ fontSize: 13.5, fontWeight: 900, letterSpacing: "-.03em", color: "#221D23" }}>
              AI Mastery Course
            </span>
            {userName && (
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#746F78" }}>
                · {userName.split(" ")[0]}
              </span>
            )}
          </div>
        </div>

        {/* Right: progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {saving && <span style={{ fontSize: 12, color: "#746F78" }}>Saving…</span>}
          <span style={{ fontSize: 13, fontWeight: 700, color: "#221D23", whiteSpace: "nowrap" }}>
            {completed.length} / {TOTAL_MODULES}
          </span>
          <div style={{ width: 96, height: 8, background: "#E8DFD2", borderRadius: 999, overflow: "hidden" }}>
            <div style={{
              width: `${pct}%`, height: "100%", background: "#FFCE00",
              borderRadius: 999, transition: "width .4s ease",
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#623CEA", minWidth: 34 }}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Course iframe */}
      <iframe
        ref={iframeRef}
        title="AI Mastery Course"
        src="/api/ai-mastery/content"
        style={{ flex: 1, width: "100%", border: 0, background: "#FEFCFA", minHeight: 0 }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
}

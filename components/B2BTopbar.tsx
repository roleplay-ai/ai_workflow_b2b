"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { formatToolLabel, normalizeActivityTools } from "@/lib/tools";

const LABELS: Record<string, string> = {
  "/workflows": "Workflows",
  "/mastery": "AI Mastery",
  "/updates": "AI Updates",
  "/team": "Team Dashboard",
  "/analytics": "Analytics",
};

const TOOL_COLORS: Record<string, string> = {
  claude: "#623CEA",
  chatgpt: "#23CE68",
  gemini: "#3696FC",
  copilot: "#F68A29",
};

type NewActivity = {
  id: string;
  title: string;
  tools: string | string[] | null | undefined;
  description?: string | null;
};

type Props = {
  searchQuery?: string;
  onSearch?: (q: string) => void;
  newActivities?: NewActivity[];
};

export default function B2BTopbar({ searchQuery = "", onSearch, newActivities = [] }: Props) {
  const pathname = usePathname();
  const [localQ, setLocalQ] = useState(searchQuery);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const pageLabel = LABELS[pathname] ?? "AI Practice Lab";
  const hasNew = newActivities.length > 0;

  function submit() { onSearch?.(localQ.trim()); }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  return (
    <div style={{
      height: "var(--topbar-h)", background: "#fff",
      borderBottom: "1px solid #E9E4DC",
      display: "flex", alignItems: "center",
      padding: "0 24px", gap: 12,
      position: "sticky", top: 0, zIndex: 40,
    }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#A09AA6" }}>
        <span>AI Practice Lab</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 2l4 4-4 4"/>
        </svg>
        <span style={{ color: "#1C1820", fontWeight: 700 }}>{pageLabel}</span>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "#F5F3EF", border: "1px solid #E9E4DC",
          borderRadius: 7, padding: "7px 12px",
          fontSize: 13, color: "#A09AA6", fontWeight: 600,
          minWidth: 200,
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="5.5" cy="5.5" r="4"/>
            <line x1="9" y1="9" x2="12" y2="12"/>
          </svg>
          <input
            value={localQ}
            onChange={e => setLocalQ(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") submit(); }}
            placeholder="Search…"
            style={{
              border: "none", outline: "none", background: "transparent",
              fontSize: 13, fontWeight: 600, color: "#1C1820",
              fontFamily: "inherit", width: "100%",
            }}
          />
        </div>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            style={{
              width: 34, height: 34, borderRadius: 7,
              border: `1px solid ${notifOpen ? "#D8D1C7" : "#E9E4DC"}`,
              background: notifOpen ? "#F5F3EF" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#746F78", position: "relative",
              padding: 0, fontFamily: "inherit",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.5 1.5a5 5 0 015 5v3l1 1.5H1.5l1-1.5v-3a5 5 0 015-5z"/>
              <path d="M5.5 11.5a2 2 0 004 0"/>
            </svg>
            {hasNew && (
              <span style={{
                position: "absolute", top: 7, right: 7,
                width: 6, height: 6, borderRadius: "50%",
                background: "#ED4551", border: "1.5px solid #fff",
              }} />
            )}
          </button>

          {/* Notification panel */}
          {notifOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 340, background: "#fff", border: "1px solid #E9E4DC",
              borderRadius: 14, boxShadow: "0 16px 48px rgba(28,24,32,.14)",
              zIndex: 99, overflow: "hidden",
            }}>
              {/* Panel header */}
              <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #F0EBE4", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1C1820", letterSpacing: "-.01em" }}>What&apos;s New</div>
                {hasNew && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, background: "#ED4551", color: "#fff", borderRadius: 999, padding: "2px 8px" }}>
                    {newActivities.length} new
                  </span>
                )}
              </div>

              {/* Activity list */}
              {newActivities.length === 0 ? (
                <div style={{ padding: "28px 16px", textAlign: "center", color: "#A09AA6", fontSize: 13, fontWeight: 600 }}>
                  No new activities yet.
                </div>
              ) : (
                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                  {newActivities.map((a, i) => {
                    const rawTools = typeof a.tools === "string" ? (JSON.parse(a.tools) as string[]) : (a.tools ?? []);
                    const tools = normalizeActivityTools(rawTools as string[]);
                    const primaryTool = tools[0] ?? null;
                    const toolColor = primaryTool ? (TOOL_COLORS[primaryTool] ?? "#746F78") : "#746F78";
                    return (
                      <a
                        key={a.id}
                        href={`/workflows/${a.id}`}
                        style={{
                          display: "block", padding: "12px 16px",
                          borderBottom: i < newActivities.length - 1 ? "1px solid #F5F1EC" : "none",
                          textDecoration: "none",
                          transition: "background .1s",
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#FAFAF8"}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ED4551", flexShrink: 0, marginTop: 5 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {primaryTool && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: toolColor, background: `${toolColor}14`, borderRadius: 5, padding: "2px 7px", display: "inline-block", marginBottom: 4 }}>
                                {formatToolLabel(primaryTool)}
                              </span>
                            )}
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1820", lineHeight: 1.3, marginBottom: a.description ? 4 : 0 }}>
                              {a.title}
                            </div>
                            {a.description && (
                              <div style={{ fontSize: 12, color: "#8C8595", fontWeight: 500, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
                                {a.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div style={{ padding: "10px 16px", borderTop: "1px solid #F0EBE4", background: "#FAFAF8" }}>
                <a href="/workflows" style={{ fontSize: 12.5, fontWeight: 700, color: "#623CEA", textDecoration: "none" }} onClick={() => setNotifOpen(false)}>
                  View all workflows →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Book a Demo — opens mailto */}
        <a
          href="mailto:team@nudgeable.ai?subject=Book a Demo — Nudgeable AI Practice Lab&body=Hi Nudgeable team,%0A%0AI'd like to book a demo of the AI Practice Lab for our organisation.%0A%0ACompany:%0ATeam size:%0ABest time to connect:%0A"
          style={{
            fontSize: 12.5, fontWeight: 800,
            background: "#FFCE00", color: "#1C1820",
            border: "none", borderRadius: 7,
            padding: "8px 16px", cursor: "pointer",
            whiteSpace: "nowrap", textDecoration: "none",
            display: "inline-block",
          }}
        >
          Book a Demo
        </a>
      </div>
    </div>
  );
}

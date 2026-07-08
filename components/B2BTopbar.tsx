"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatToolLabel, normalizeActivityTools } from "@/lib/tools";
import { createClient } from "@/lib/supabase/client";

const LABELS: Record<string, string> = {
  "/workflows": "Workflows",
  "/mastery": "AI Mastery",
  "/updates": "AI Updates",
  "/team": "Team Dashboard",
  "/analytics": "Analytics",
  "/profile": "My Progress",
  "/ask-ai": "Ask AI",
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

type FeaturedTag = {
  id: string;
  name: string;
  icon_url: string | null;
  featured_description: string | null;
};

type Props = {
  searchQuery?: string;
  onSearch?: (q: string) => void;
  newActivities?: NewActivity[];
  activeTag?: string | null;
};

export default function B2BTopbar({ searchQuery = "", onSearch, newActivities = [], activeTag = null }: Props) {
  const pathname = usePathname();
  const [localQ, setLocalQ] = useState(searchQuery);
  const [notifOpen, setNotifOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [featuredTags, setFeaturedTags] = useState<FeaturedTag[]>([]);
  const topbarActionsRef = useRef<HTMLDivElement>(null);
  const pageLabel = LABELS[pathname] ?? "AI Practice Lab";
  const hasNew = newActivities.length > 0;
  const hasFeaturedTags = featuredTags.length > 0;

  function submit() { onSearch?.(localQ.trim()); }

  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      try {
        const { data } = await supabase
          .from("activity_tags")
          .select("id, name, icon_url, featured_description")
          .eq("is_featured", true)
          .order("featured_position")
          .order("name");
        if (data) setFeaturedTags(data as FeaturedTag[]);
      } catch {
        // Ignore transient network/auth errors during featured-tag fetch.
      }
    })();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (topbarActionsRef.current && !topbarActionsRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
        setTagsOpen(false);
      }
    }
    if (notifOpen || tagsOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen, tagsOpen]);

  const panelStyle: React.CSSProperties = {
    position: "absolute", top: "calc(100% + 8px)", right: 0,
    width: 340, background: "#fff", border: "1px solid #E9E4DC",
    borderRadius: 14, boxShadow: "0 16px 48px rgba(28,24,32,.14)",
    zIndex: 99, overflow: "hidden",
  };

  const agentsBtnStyle = (open: boolean): React.CSSProperties => ({
    width: 36, height: 36, borderRadius: 10,
    border: `1.5px solid ${open ? "#623CEA" : "rgba(98,60,234,.22)"}`,
    background: open ? "#623CEA" : "var(--bg)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
    color: open ? "#FFCE00" : "#623CEA",
    position: "relative", padding: 0, fontFamily: "inherit",
    boxShadow: open ? "0 4px 14px rgba(98,60,234,.28)" : "none",
    transition: "all .15s ease",
  });

  const notifBtnStyle = (open: boolean): React.CSSProperties => ({
    width: 36, height: 36, borderRadius: 10,
    border: `1.5px solid ${open ? "#1C1820" : hasNew ? "rgba(255,206,0,.55)" : "#E9E4DC"}`,
    background: open ? "#1C1820" : hasNew ? "#FFFBEB" : "var(--bg)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
    color: open ? "#FFCE00" : "#1C1820",
    position: "relative", padding: 0, fontFamily: "inherit",
    boxShadow: hasNew && !open ? "0 0 0 3px rgba(255,206,0,.18)" : "none",
    transition: "all .15s ease",
  });

  return (
    <div style={{
      height: "var(--topbar-h)", background: "#fff",
      borderBottom: "1px solid #E9E4DC",
      display: "flex", alignItems: "center",
      padding: "0 24px", gap: 12,
      position: "sticky", top: 0, zIndex: 300,
    }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#A09AA6" }}>
        <span>AI Practice Lab</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 2l4 4-4 4"/>
        </svg>
        <span style={{ color: "#1C1820", fontWeight: 700 }}>{pageLabel}</span>
      </div>

      <div ref={topbarActionsRef} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "var(--bg)", border: "1px solid #E9E4DC",
          borderRadius: 7, padding: "7px 12px",
          fontSize: 13, color: "#A09AA6", fontWeight: 600,
          minWidth: 320,
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

        {/* Ask AI */}
        <Link
          href="/ask-ai"
          title="Ask AI"
          style={{
            display: "flex", alignItems: "center", gap: 7,
            height: 36, padding: "0 14px", borderRadius: 10,
            border: `1.5px solid ${pathname === "/ask-ai" ? "#FFCE00" : "rgba(255,206,0,.4)"}`,
            background: pathname === "/ask-ai" ? "#FFCE00" : "#FFFBEB",
            color: "#7A5F00", fontSize: 12.5, fontWeight: 800,
            textDecoration: "none", flexShrink: 0,
            transition: "all .15s ease",
          }}
        >
          <span style={{ fontSize: 14 }}>✦</span>
          Ask AI
        </Link>

        {/* Featured agents */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => { setTagsOpen(o => !o); setNotifOpen(false); }}
            title="Featured agents"
            style={agentsBtnStyle(tagsOpen)}
          >
            <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 2.5h4.2L8.5 6.3l2.8-1.1 1.1 2.8-3.8 1.8-1.8 3.8-1.1-2.8-2.8-1.1 1.8-3.8z"/>
            </svg>
          </button>

          {tagsOpen && (
            <div style={panelStyle}>
              <div style={{
                padding: "14px 16px 12px", borderBottom: "1px solid #F0EBE4",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "var(--bg)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#623CEA", letterSpacing: "-.01em" }}>Featured Agents</div>
                {hasFeaturedTags && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, background: "#FFCE00", color: "#1C1820", borderRadius: 999, padding: "2px 8px" }}>
                    {featuredTags.length}
                  </span>
                )}
              </div>

              {featuredTags.length === 0 ? (
                <div style={{ padding: "28px 16px", textAlign: "center", color: "#A09AA6", fontSize: 13, fontWeight: 600 }}>
                  No featured agents yet.
                </div>
              ) : (
                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                  {featuredTags.map((tag, i) => {
                    const isActive = activeTag?.toLowerCase() === tag.name.toLowerCase();
                    return (
                      <Link
                        key={tag.id}
                        href={`/workflows?tag=${encodeURIComponent(tag.name)}`}
                        onClick={() => setTagsOpen(false)}
                        style={{
                          display: "block", padding: "12px 16px",
                          borderBottom: i < featuredTags.length - 1 ? "1px solid #F5F1EC" : "none",
                          textDecoration: "none",
                          background: isActive ? "#FFFBEB" : "transparent",
                          transition: "background .1s",
                        }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#FAFAF8"; }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          {tag.icon_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={tag.icon_url}
                              alt={tag.name}
                              width={28}
                              height={28}
                              style={{ objectFit: "contain", borderRadius: 6, border: "1px solid #E9E4DC", flexShrink: 0, marginTop: 1 }}
                            />
                          ) : (
                            <div style={{
                              width: 28, height: 28, borderRadius: 6, border: "1px solid #E9E4DC",
                              background: "var(--bg)", display: "grid", placeItems: "center",
                              fontSize: 9, fontWeight: 800, color: "#746F78", flexShrink: 0, marginTop: 1,
                            }}>
                              {tag.name.slice(0, 3).toUpperCase()}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1C1820", lineHeight: 1.3, marginBottom: tag.featured_description ? 4 : 0 }}>
                              {tag.name}
                              {isActive && (
                                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: "#7A5F00", background: "rgba(255,206,0,.2)", borderRadius: 4, padding: "1px 6px" }}>
                                  Active
                                </span>
                              )}
                            </div>
                            {tag.featured_description && (
                              <div style={{ fontSize: 12, color: "#8C8595", fontWeight: 500, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as React.CSSProperties["WebkitBoxOrient"], overflow: "hidden" }}>
                                {tag.featured_description}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {hasFeaturedTags && (
                <div style={{ padding: "10px 16px", borderTop: "1px solid #F0EBE4", background: "#FAFAF8" }}>
                  <Link href="/workflows" style={{ fontSize: 12.5, fontWeight: 700, color: "#623CEA", textDecoration: "none" }} onClick={() => setTagsOpen(false)}>
                    View all workflows →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: "relative", overflow: "visible" }}>
          <button
            onClick={() => { setNotifOpen(o => !o); setTagsOpen(false); }}
            title="What's new"
            style={notifBtnStyle(notifOpen)}
          >
            <svg width="16" height="16" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.5 1.5a5 5 0 015 5v3l1 1.5H1.5l1-1.5v-3a5 5 0 015-5z"/>
              <path d="M5.5 11.5a2 2 0 004 0"/>
            </svg>
            {hasNew && (
              <span style={{
                position: "absolute", top: -3, right: -3,
                width: 10, height: 10, borderRadius: "50%",
                background: "#ED4551",
                border: "2.5px solid #fff",
                boxShadow: "0 0 0 1.5px #ED4551",
                pointerEvents: "none",
              }} />
            )}
          </button>

          {notifOpen && (
            <div style={panelStyle}>
              <div style={{
                padding: "14px 16px 12px", borderBottom: "1px solid #F0EBE4",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "var(--bg)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1C1820", letterSpacing: "-.01em" }}>What&apos;s New</div>
                {hasNew && (
                  <span style={{ fontSize: 10.5, fontWeight: 700, background: "#ED4551", color: "#fff", borderRadius: 999, padding: "2px 8px" }}>
                    {newActivities.length} new
                  </span>
                )}
              </div>

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
                        href={`/activity/${a.id}`}
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
                              <div style={{ fontSize: 12, color: "#8C8595", fontWeight: 500, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as React.CSSProperties["WebkitBoxOrient"], overflow: "hidden" }}>
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

              <div style={{ padding: "10px 16px", borderTop: "1px solid #F0EBE4", background: "#FAFAF8" }}>
                <a href="/workflows" style={{ fontSize: 12.5, fontWeight: 700, color: "#623CEA", textDecoration: "none" }} onClick={() => setNotifOpen(false)}>
                  View all workflows →
                </a>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import type { Activity } from "@/lib/supabase/types";
import { formatToolLabel, normalizeActivityTools } from "@/lib/tools";
import type { ToolLogoMap } from "@/lib/toolLogos";
import B2BTopbar from "@/components/B2BTopbar";
import ActivityCard, { getTheme, Scene } from "@/components/ActivityCard";
import ModuleHtmlModal from "@/components/ModuleHtmlModal";

// ── Foundation module type ─────────────────────────────────────────────────

type FoundationModule = {
  id: string;
  title: string;
  emoji: string;
  description?: string | null;
  concepts: string[];
  sort_order: number;
  is_locked: boolean;
  html_path: string | null;
};

// ── Stat card ─────────────────────────────────────────────────────────────

function StatCard({ label, value, delta, dark = false }: { label: string; value: string; delta?: string; dark?: boolean }) {
  return (
    <div style={{ background: dark ? "#1C1820" : "#fff", border: `1px solid ${dark ? "#2E2930" : "#E9E4DC"}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: dark ? "rgba(255,255,255,.45)" : "#746F78", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: dark ? 32 : 28, fontWeight: 900, letterSpacing: "-.04em", color: dark ? "#FFCE00" : "#1C1820", lineHeight: 1 }}>
        {value}
      </div>
      {delta && <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 5, color: dark ? "rgba(255,255,255,.55)" : "#23CE68" }}>{delta}</div>}
    </div>
  );
}

// ── Filter tab chip ───────────────────────────────────────────────────────

type FilterTab = "new" | "essentials" | "continue" | null;

function TabChip({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`tab-chip${active ? " active" : ""}`}
      onClick={onClick}
    >
      <span className="tab-chip-icon">{icon}</span>
      {label}
    </button>
  );
}

// ── Tool select ───────────────────────────────────────────────────────────

function ToolSelect({ tools, selected, onChange }: { tools: string[]; selected: string | null; onChange: (t: string | null) => void }) {
  return (
    <select
      value={selected ?? ""}
      onChange={e => onChange(e.target.value || null)}
      style={{ fontSize: 12.5, fontWeight: 700, color: "#1C1820", padding: "6px 11px", border: "1.5px solid #E9E4DC", borderRadius: 7, background: "#fff", cursor: "pointer", outline: "none", fontFamily: "inherit" }}
    >
      <option value="">All Tools</option>
      {tools.map(t => <option key={t} value={t}>{formatToolLabel(t)}</option>)}
    </select>
  );
}

// ── Function card (exact replica of main app) ────────────────────────────

function FunctionCard({ name, count, description, thumbnail, onClick }: { name: string; count: number; description?: string | null; thumbnail?: string | null; onClick: () => void }) {
  const theme = getTheme(name);
  const countLabel = `${count} workflow${count !== 1 ? "s" : ""}`;

  return (
    <div
      className="workflow-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      style={{ cursor: "pointer" }}
    >
      <div className={`card-poster ${theme.posterColor}${thumbnail ? " has-thumbnail" : ""}`}>
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="card-thumbnail" src={thumbnail} alt="" />
        ) : (
          <Scene theme={theme} />
        )}
      </div>
      <div className="card-body function-card-body">
        <div className="meta-line">
          <span className="function-card-count">{countLabel}</span>
        </div>
        <h3 className="card-title">{name}</h3>
        {description && <p className="card-desc">{description}</p>}
        <div className="function-card-footer">
          <span className="function-card-cta">Try it →</span>
        </div>
      </div>
    </div>
  );
}

// ── Functions grid ────────────────────────────────────────────────────────

function FunctionsGrid({ activities, selectedTool, onSelect, functionThumbnails, functionDescriptions }: {
  activities: Activity[];
  selectedTool: string | null;
  onSelect: (fn: string) => void;
  functionThumbnails: Record<string, string>;
  functionDescriptions: Record<string, string>;
}) {
  const functions = useMemo(() => {
    const src = selectedTool
      ? activities.filter(a => normalizeActivityTools(a.tools).some(t => t.toLowerCase() === selectedTool.toLowerCase()))
      : activities;
    const map = new Map<string, number>();
    src.forEach(a => (a.functions ?? []).forEach(fn => { const k = fn.trim(); if (k) map.set(k, (map.get(k) ?? 0) + 1); }));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [activities, selectedTool]);

  if (functions.length === 0) return (
    <div className="static-grid-empty">No workflow types found{selectedTool ? ` for ${formatToolLabel(selectedTool)}` : ""}.</div>
  );

  return (
    <div className="static-grid">
      {functions.map(([fn, count]) => {
        const key = fn.toLowerCase();
        return (
          <div key={fn} className="static-grid-slot">
            <FunctionCard
              name={fn}
              count={count}
              thumbnail={functionThumbnails[key] ?? null}
              description={functionDescriptions[key] ?? null}
              onClick={() => onSelect(fn)}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── AI Foundations carousel ───────────────────────────────────────────────

const FOUNDATION_THEMES = [
  { soft: "#FFF6CF", accent: "#F68A29" },
  { soft: "#EAF5FF", accent: "#3699FC" },
  { soft: "#F1ECFF", accent: "#623CEA" },
  { soft: "#E9FFF2", accent: "#23CE6B" },
  { soft: "#FDE4CC", accent: "#F68A29" },
  { soft: "#FFECEF", accent: "#ED4551" },
  { soft: "#F1ECFF", accent: "#623CEA" },
  { soft: "#EAF5FF", accent: "#3699FC" },
];

function AIFoundationsSection({ modules }: { modules: FoundationModule[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeModule, setActiveModule] = useState<FoundationModule | null>(null);

  if (modules.length === 0) return null;

  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -442 : 442, behavior: "smooth" });

  return (
    <>
      {activeModule && (
        <ModuleHtmlModal
          moduleId={activeModule.id}
          moduleTitle={activeModule.title}
          moduleEmoji={activeModule.emoji || "📘"}
          onClose={() => setActiveModule(null)}
        />
      )}

      <section style={{ padding: "32px 28px 40px", borderTop: "1px solid #E9E4DC", background: "#F5F3EF" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 22, marginBottom: 22 }}>
          <div style={{ position: "relative", paddingLeft: 22 }}>
            <div style={{ position: "absolute", left: 0, top: 4, width: 7, height: 58, borderRadius: 999, background: "#FFCE00", border: "1px solid rgba(28,24,32,.18)" }} />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "#746F78", marginBottom: 4 }}>Learn</div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-.04em", color: "#1C1820" }}>AI Foundations</h2>
            <p style={{ margin: "6px 0 0", color: "#6B6670", fontSize: 13.5, fontWeight: 600, lineHeight: 1.45 }}>Short explainers that build practical AI fluency.</p>
          </div>
          <a href="/mastery" style={{ fontSize: 13, fontWeight: 700, color: "#623CEA", whiteSpace: "nowrap", textDecoration: "none" }}>See all topics →</a>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => scroll("left")} style={{ flexShrink: 0, width: 42, height: 52, borderRadius: 999, background: "#fff", border: "1px solid #E9E4DC", boxShadow: "0 16px 35px rgba(28,24,32,.13)", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 950, cursor: "pointer", fontFamily: "inherit" }}>‹</button>

          <div ref={scrollRef} style={{ flex: 1, minWidth: 0, overflowX: "auto", overflowY: "visible", padding: "12px 0 20px", margin: "-12px 0 -20px", scrollbarWidth: "none" }}>
            <div style={{ display: "flex", gap: 16, width: "max-content", alignItems: "flex-start" }}>
              {modules.map((mod, i) => {
                const { soft, accent } = FOUNDATION_THEMES[i % FOUNDATION_THEMES.length];
                const sub = mod.description?.trim() || mod.concepts?.[0] || "";
                return (
                  <div key={mod.id} style={{ flexShrink: 0, width: 205, paddingTop: 4, paddingBottom: 8 }}>
                    <div
                      onClick={() => { if (!mod.is_locked) setActiveModule(mod); }}
                      style={{ width: "100%", minHeight: 188, borderRadius: 16, border: "1px solid #E8E0D1", background: "#fff", boxShadow: "0 10px 24px rgba(28,24,32,.06)", cursor: mod.is_locked ? "not-allowed" : "pointer", display: "flex", flexDirection: "column", padding: 18, boxSizing: "border-box", opacity: mod.is_locked ? 0.55 : 1, transition: "transform .15s, box-shadow .15s" }}
                      onMouseEnter={e => { if (!mod.is_locked) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 14px 28px rgba(28,24,32,.09)"; } }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 24px rgba(28,24,32,.06)"; }}
                    >
                      <div style={{ width: 54, height: 54, borderRadius: 16, display: "grid", placeItems: "center", background: soft, marginBottom: 16, flexShrink: 0, fontSize: 26 }}>
                        {mod.is_locked ? "🔒" : (mod.emoji || "📘")}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: "#1C1820", margin: "0 0 7px", lineHeight: 1.18 }}>{mod.title}</div>
                      <div style={{ fontSize: 13, fontWeight: 400, color: "#6B6B6B", lineHeight: 1.42, margin: "0 0 14px", flex: 1 }}>{sub || " "}</div>
                      <span style={{ display: "inline-flex", width: "fit-content", alignItems: "center", fontSize: 10, fontWeight: 900, color: accent, letterSpacing: 1, textTransform: "uppercase" }}>
                        {mod.is_locked ? "Locked" : "Learn →"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={() => scroll("right")} style={{ flexShrink: 0, width: 42, height: 52, borderRadius: 999, background: "#fff", border: "1px solid #E9E4DC", boxShadow: "0 16px 35px rgba(28,24,32,.13)", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 950, cursor: "pointer", fontFamily: "inherit" }}>›</button>
        </div>
      </section>
    </>
  );
}

// ── Main client component ─────────────────────────────────────────────────

type Props = {
  activities: Activity[];
  toolLogos: ToolLogoMap;
  viewCounts: Record<string, number>;
  completedIds: Set<string>;
  totalAvailable: number;
  completedCount: number;
  inProgressCount: number;
  modules: FoundationModule[];
  functionThumbnails: Record<string, string>;
  functionDescriptions: Record<string, string>;
};

export default function WorkflowsClient({ activities, toolLogos, viewCounts, completedIds, totalAvailable, completedCount, inProgressCount, modules, functionThumbnails, functionDescriptions }: Props) {
  const [selectedTab, setSelectedTab] = useState<FilterTab>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [extraRows, setExtraRows] = useState(0);
  const COLS = 4;

  const showActivities = selectedTab !== null || !!selectedFunction || !!searchQuery.trim() || !!selectedTool;

  const allTools = useMemo(() => {
    const s = new Set<string>();
    activities.forEach(a => normalizeActivityTools(a.tools).forEach(t => s.add(t)));
    return [...s];
  }, [activities]);

  const allFunctions = useMemo(() => {
    const s = new Set<string>();
    activities.forEach(a => (a.functions ?? []).forEach(f => { if (f) s.add(f); }));
    return [...s].sort();
  }, [activities]);

  const filtered = useMemo(() => {
    let result = activities;
    if (selectedTab === "new") result = result.filter(a => a.is_featured);
    if (selectedTab === "essentials") result = result.filter(a => (a as any).is_mastery);
    if (selectedTab === "continue") result = result.filter(a => !completedIds.has(a.id));
    if (selectedTool) result = result.filter(a => normalizeActivityTools(a.tools).includes(selectedTool));
    if (selectedFunction) result = result.filter(a => (a.functions ?? []).some(f => f.toLowerCase() === selectedFunction.toLowerCase()));
    const q = searchQuery.trim().toLowerCase();
    if (q) result = result.filter(a =>
      a.title.toLowerCase().includes(q) ||
      (a.description ?? "").toLowerCase().includes(q) ||
      normalizeActivityTools(a.tools).some(t => formatToolLabel(t).toLowerCase().includes(q))
    );
    return result;
  }, [activities, selectedTab, selectedTool, selectedFunction, searchQuery, completedIds]);

  const visibleCount = COLS * (2 + extraRows);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => { setExtraRows(0); }, [selectedTab, selectedTool, selectedFunction, searchQuery]);

  const completionPct = totalAvailable > 0 ? Math.round((completedCount / totalAvailable) * 100) : 0;

  function handleTabToggle(tab: Exclude<FilterTab, null>) {
    setSelectedTab(prev => prev === tab ? null : tab);
    setSelectedFunction(null);
  }

  const sectionTitle = selectedFunction
    ? selectedFunction
    : selectedTab === "new" ? "New This Week"
    : selectedTab === "essentials" ? "Start Here"
    : selectedTab === "continue" ? "Continue"
    : "All Workflows";

  const sectionDesc = selectedFunction
    ? `${filtered.length} workflow${filtered.length !== 1 ? "s" : ""} in ${selectedFunction}`
    : selectedTab
    ? `${filtered.length} workflow${filtered.length !== 1 ? "s" : ""} match your filters.`
    : "Browse every guided workflow in the library. Filter by tool or function to find what fits your work.";

  return (
    <>
      <B2BTopbar
        searchQuery={searchQuery}
        onSearch={q => { setSearchQuery(q); setSelectedFunction(null); }}
        newActivities={activities.filter(a => a.is_featured).slice(0, 8).map(a => ({ id: a.id, title: a.title, tools: a.tools, description: (a as any).description ?? null }))}
      />

      <div style={{ flex: 1, background: "#F5F3EF" }}>
        {/* Page header */}
        <div style={{ background: "#F5F3EF", borderBottom: "1px solid #E9E4DC", padding: "22px 28px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-.03em", color: "#1C1820", lineHeight: 1.1 }}>Workflows</h1>
              <p style={{ fontSize: 13.5, color: "#746F78", fontWeight: 600, marginTop: 4 }}>Guided AI automations tailored to your tool stack and job function.</p>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", borderRadius: 999, padding: "5px 12px", background: "rgba(98,60,234,.08)", color: "#623CEA", border: "1px solid rgba(98,60,234,.18)", whiteSpace: "nowrap" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#623CEA", display: "inline-block" }} />
              Updated this week
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
            <StatCard label="Available" value={String(totalAvailable)} />
            <StatCard label="Completed" value={String(completedCount)} delta={completedCount > 0 ? "Keep going!" : "Start your first workflow"} />
            <StatCard label="In Progress" value={String(inProgressCount)} delta={inProgressCount > 0 ? "Pick up where you left off" : "Start a workflow to track"} />
            <StatCard label="My Progress" value={`${completionPct}%`} delta={`${completedCount} of ${totalAvailable} done`} dark />
          </div>

          {/* Filter bar */}
          <div className="ndb-root">
            <div className="workflows-filter-bar">
              <TabChip label="New" icon="🔥" active={selectedTab === "new"} onClick={() => handleTabToggle("new")} />
              <TabChip label="Start Here" icon="🤖" active={selectedTab === "essentials"} onClick={() => handleTabToggle("essentials")} />
              {completedCount > 0 && (
                <TabChip label="Continue" icon="⏩" active={selectedTab === "continue"} onClick={() => handleTabToggle("continue")} />
              )}
              <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                <ToolSelect tools={allTools} selected={selectedTool} onChange={t => { setSelectedTool(t); setSelectedFunction(null); }} />
                <select
                  value={selectedFunction ?? ""}
                  onChange={e => { setSelectedFunction(e.target.value || null); setSelectedTab(null); }}
                  style={{ fontSize: 12.5, fontWeight: 700, color: "#1C1820", padding: "6px 11px", border: "1.5px solid #E9E4DC", borderRadius: 7, background: "#fff", cursor: "pointer", outline: "none", fontFamily: "inherit" }}
                >
                  <option value="">All Functions</option>
                  {allFunctions.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="ndb-root" style={{ padding: "0 28px" }}>

          {/* Functions grid — shown when no active filter */}
          {!showActivities && (
            <section className="rail">
              <div className="rail-header">
                <div className="rail-title">
                  <span className="section-label">Workflow types</span>
                  <h2>Browse by Outcome</h2>
                  <p>Pick a workflow type to see all guided activities for that function.</p>
                </div>
              </div>
              <FunctionsGrid
                activities={activities}
                selectedTool={selectedTool}
                onSelect={fn => { setSelectedFunction(fn); setSelectedTab(null); }}
                functionThumbnails={functionThumbnails}
                functionDescriptions={functionDescriptions}
              />
            </section>
          )}

          {/* Activity grid — shown when any filter active */}
          {showActivities && (
            <section className="rail" id="all-workflows">
              <div className="rail-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div className="rail-title">
                  <span className="section-label">Full library</span>
                  <h2>{sectionTitle}</h2>
                  <p>{sectionDesc}</p>
                </div>
                {selectedFunction && (
                  <button
                    onClick={() => { setSelectedFunction(null); setSelectedTab(null); }}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: "#623CEA", background: "rgba(98,60,234,.07)", border: "1px solid rgba(98,60,234,.18)", borderRadius: 7, cursor: "pointer", padding: "7px 13px", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0, marginTop: 4 }}
                  >
                    ← All Functions
                  </button>
                )}
              </div>

              {visible.length === 0 ? (
                <div className="static-grid-empty">No workflows match your filters. Try adjusting them.</div>
              ) : (
                <>
                  <div className="static-grid">
                    {visible.map(a => (
                      <div key={a.id} className="static-grid-slot">
                        <ActivityCard activity={a} toolLogos={toolLogos} viewCount={viewCounts[a.id] ?? 0} isCompleted={completedIds.has(a.id)} />
                      </div>
                    ))}
                  </div>
                  {hasMore && (
                    <div className="static-grid-more">
                      <button className="view-more-link" onClick={() => setExtraRows(r => r + 2)}>
                        View more workflows
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </div>

        {/* AI Foundations */}
        <AIFoundationsSection modules={modules} />
      </div>
    </>
  );
}

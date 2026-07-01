"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Activity } from "@/lib/supabase/types";
import { formatToolLabel, normalizeActivityTools } from "@/lib/tools";
import type { ToolLogoMap } from "@/lib/toolLogos";
import B2BTopbar from "@/components/B2BTopbar";
import ActivityCard, { getTheme, Scene } from "@/components/ActivityCard";
import ModuleHtmlModal from "@/components/ModuleHtmlModal";
import ToolIcon from "@/components/ToolIcon";

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

// ── Tool chip ─────────────────────────────────────────────────────────────

function ToolChip({ tool, selected, toolLogos, onClick }: { tool: string; selected: boolean; toolLogos: ToolLogoMap; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`workflows-tool-chip${selected ? " is-active" : ""}`}
      onClick={onClick}
      aria-pressed={selected}
      title={formatToolLabel(tool)}
    >
      <span className="workflows-tool-chip-icon">
        <ToolIcon tool={tool} size={28} logos={toolLogos} insetScale={0.88} />
      </span>
      <span className="workflows-tool-chip-label">{formatToolLabel(tool)}</span>
    </button>
  );
}

// ── Function dropdown ─────────────────────────────────────────────────────

function FunctionDropdown({ functions, selected, onChange }: {
  functions: [string, number][];
  selected: string | null;
  onChange: (fn: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const label = selected ?? "Functions";

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          height: 40, padding: "0 14px",
          borderRadius: 999,
          border: `1.5px solid ${selected ? "#1C1820" : "#E9E4DC"}`,
          background: selected ? "#1C1820" : "#fff",
          color: selected ? "#FFCE00" : "#1C1820",
          fontSize: 12.5, fontWeight: 800,
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 3px 10px rgba(34,29,35,.05)",
          transition: "all .15s",
          whiteSpace: "nowrap",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.65 }}>
          <rect x="1" y="3" width="14" height="2.5" rx="1.2"/>
          <rect x="3" y="7.5" width="10" height="2.5" rx="1.2"/>
          <rect x="5.5" y="12" width="5" height="2.5" rx="1.2"/>
        </svg>
        {label}
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"
          style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.6 }}>
          <path d="M2 4l4 4 4-4"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          minWidth: 220, maxHeight: 320,
          background: "#fff", borderRadius: 14,
          border: "1px solid #E9E4DC",
          boxShadow: "0 16px 48px rgba(28,24,32,.14)",
          zIndex: 99, overflowY: "auto",
          padding: "6px",
        }}>
          {/* All option */}
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "9px 12px", borderRadius: 8,
              border: "none", background: selected === null ? "rgba(98,60,234,.08)" : "transparent",
              color: selected === null ? "#623CEA" : "#1C1820",
              fontSize: 13, fontWeight: selected === null ? 800 : 600,
              cursor: "pointer", fontFamily: "inherit", textAlign: "left",
              transition: "background .1s",
            }}
            onMouseEnter={e => { if (selected !== null) (e.currentTarget as HTMLElement).style.background = "#F5F3EF"; }}
            onMouseLeave={e => { if (selected !== null) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <span>All Functions</span>
            {selected === null && <span style={{ fontSize: 12, color: "#623CEA" }}>✓</span>}
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: "#F0EBE3", margin: "4px 6px" }} />

          {functions.map(([fn, count]) => {
            const active = selected === fn;
            return (
              <button
                key={fn}
                type="button"
                onClick={() => { onChange(fn); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  border: "none", background: active ? "rgba(98,60,234,.08)" : "transparent",
                  color: active ? "#623CEA" : "#1C1820",
                  fontSize: 13, fontWeight: active ? 800 : 600,
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  transition: "background .1s",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#F5F3EF"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span style={{ flex: 1, marginRight: 8 }}>{fn}</span>
                <span style={{
                  fontSize: 10.5, fontWeight: 700,
                  color: active ? "#623CEA" : "#A09AA6",
                  background: active ? "rgba(98,60,234,.1)" : "#F5F3EF",
                  borderRadius: 999, padding: "2px 7px", flexShrink: 0,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
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

function activityHasTag(activity: Activity, tagName: string): boolean {
  return (activity.tags ?? []).some(t => t.toLowerCase() === tagName.toLowerCase());
}

type Props = {
  activities: Activity[];
  toolLogos: ToolLogoMap;
  tagLogos: Record<string, string>;
  viewCounts: Record<string, number>;
  completedIds: Set<string>;
  totalAvailable: number;
  completedCount: number;
  inProgressCount: number;
  modules: FoundationModule[];
  functionThumbnails: Record<string, string>;
  functionDescriptions: Record<string, string>;
};

export default function WorkflowsClient({ activities, toolLogos, tagLogos, viewCounts, completedIds, totalAvailable, completedCount, inProgressCount, modules, functionThumbnails, functionDescriptions }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get("tag");
  const [selectedTab, setSelectedTab] = useState<FilterTab>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [extraRows, setExtraRows] = useState(0);
  const COLS = 4;

  function clearTagFilter() {
    router.replace("/workflows", { scroll: false });
  }

  const showActivities = selectedTab !== null || !!selectedFunction || !!searchQuery.trim() || !!selectedTool || !!selectedTag;

  const allTools = useMemo(() => {
    const s = new Set<string>();
    activities.forEach(a => normalizeActivityTools(a.tools).forEach(t => s.add(t)));
    return [...s];
  }, [activities]);

  const allFunctions = useMemo((): [string, number][] => {
    const map = new Map<string, number>();
    activities.forEach(a => (a.functions ?? []).forEach(f => { if (f) map.set(f, (map.get(f) ?? 0) + 1); }));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [activities]);

  const filtered = useMemo(() => {
    let result = activities;
    if (selectedTab === "new") result = result.filter(a => a.is_featured);
    if (selectedTab === "essentials") result = result.filter(a => (a as any).is_mastery);
    if (selectedTab === "continue") result = result.filter(a => !completedIds.has(a.id));
    if (selectedTool) result = result.filter(a => normalizeActivityTools(a.tools).includes(selectedTool));
    if (selectedFunction) result = result.filter(a => (a.functions ?? []).some(f => f.toLowerCase() === selectedFunction.toLowerCase()));
    if (selectedTag) result = result.filter(a => activityHasTag(a, selectedTag));
    const q = searchQuery.trim().toLowerCase();
    if (q) result = result.filter(a =>
      a.title.toLowerCase().includes(q) ||
      (a.description ?? "").toLowerCase().includes(q) ||
      normalizeActivityTools(a.tools).some(t => formatToolLabel(t).toLowerCase().includes(q))
    );
    return result;
  }, [activities, selectedTab, selectedTool, selectedFunction, selectedTag, searchQuery, completedIds]);

  const visibleCount = COLS * (2 + extraRows);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => { setExtraRows(0); }, [selectedTab, selectedTool, selectedFunction, selectedTag, searchQuery]);

  useEffect(() => {
    if (!selectedTag) return;
    const el = document.getElementById("all-workflows");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedTag]);

  const completionPct = totalAvailable > 0 ? Math.round((completedCount / totalAvailable) * 100) : 0;

  function handleTabToggle(tab: Exclude<FilterTab, null>) {
    clearTagFilter();
    setSelectedTab(prev => prev === tab ? null : tab);
    setSelectedFunction(null);
  }

  const sectionTitle = selectedTag
    ? selectedTag
    : selectedFunction
    ? selectedFunction
    : selectedTab === "new" ? "New This Week"
    : selectedTab === "essentials" ? "Start Here"
    : selectedTab === "continue" ? "Continue"
    : "All Workflows";

  const sectionDesc = selectedTag
    ? `${filtered.length} workflow${filtered.length !== 1 ? "s" : ""} tagged with ${selectedTag}`
    : selectedFunction
    ? `${filtered.length} workflow${filtered.length !== 1 ? "s" : ""} in ${selectedFunction}`
    : selectedTab
    ? `${filtered.length} workflow${filtered.length !== 1 ? "s" : ""} match your filters.`
    : "Browse every guided workflow in the library. Filter by tool or function to find what fits your work.";

  return (
    <>
      <B2BTopbar
        searchQuery={searchQuery}
        onSearch={q => { clearTagFilter(); setSearchQuery(q); setSelectedFunction(null); }}
        newActivities={activities.filter(a => a.is_featured).slice(0, 8).map(a => ({ id: a.id, title: a.title, tools: a.tools, description: (a as any).description ?? null }))}
        activeTag={selectedTag}
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
          <div className="ndb-root" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Chips — scrollable row */}
            <div className="workflows-filter-bar" style={{ flex: 1, minWidth: 0 }}>
              <TabChip label="New" icon="🔥" active={selectedTab === "new"} onClick={() => handleTabToggle("new")} />
              <TabChip label="Start Here" icon="🤖" active={selectedTab === "essentials"} onClick={() => handleTabToggle("essentials")} />
              {allTools.map(tool => (
                <ToolChip
                  key={tool}
                  tool={tool}
                  selected={selectedTool === tool}
                  toolLogos={toolLogos}
                  onClick={() => { clearTagFilter(); setSelectedTool(selectedTool === tool ? null : tool); setSelectedFunction(null); }}
                />
              ))}
              {completedCount > 0 && (
                <TabChip label="Continue" icon="⏩" active={selectedTab === "continue"} onClick={() => handleTabToggle("continue")} />
              )}
            </div>
            {/* Functions dropdown — always visible on the right, outside the scroll container */}
            <div style={{ flexShrink: 0, position: "relative", zIndex: 200 }}>
              <FunctionDropdown
                functions={allFunctions}
                selected={selectedFunction}
                onChange={fn => { clearTagFilter(); setSelectedFunction(fn); setSelectedTab(null); }}
              />
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
                onSelect={fn => { clearTagFilter(); setSelectedFunction(fn); setSelectedTab(null); }}
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
                {selectedTag && (
                  <button
                    onClick={clearTagFilter}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: "#7A5F00", background: "rgba(255,206,0,.12)", border: "1px solid rgba(255,206,0,.35)", borderRadius: 7, cursor: "pointer", padding: "7px 13px", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0, marginTop: 4 }}
                  >
                    ← Clear tag
                  </button>
                )}
                {selectedFunction && !selectedTag && (
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
                        <ActivityCard activity={a} toolLogos={toolLogos} tagLogos={tagLogos} viewCount={viewCounts[a.id] ?? 0} isCompleted={completedIds.has(a.id)} />
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

"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Activity } from "@/lib/supabase/types";
import { formatToolLabel, normalizeActivityTools } from "@/lib/tools";
import { formatTopPercentile } from "@/lib/points";
import type { ToolLogoMap } from "@/lib/toolLogos";
import B2BTopbar from "@/components/B2BTopbar";
import ActivityCard, { getTheme, Scene } from "@/components/ActivityCard";
import ModuleHtmlModal from "@/components/ModuleHtmlModal";
import ToolIcon from "@/components/ToolIcon";
import "@/app/card-styles.css";

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

function FireIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.176 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 0 1 1.925-3.545 3.75 3.75 0 0 1 3.255 3.717Z"/>
    </svg>
  );
}

function StatCard({ label, value, delta, deltaColor, labelColor, dark = false, valueIcon }: { label: string; value: string; delta?: string; deltaColor?: string; labelColor?: string; dark?: boolean; valueIcon?: React.ReactNode }) {
  const resolvedDeltaColor = deltaColor ?? (dark ? "rgba(255,255,255,.55)" : "#23CE68");
  const resolvedLabelColor = labelColor ?? (dark ? "rgba(255,255,255,.45)" : "#746F78");
  return (
    <div style={{ background: dark ? "#1C1820" : "#fff", border: `1px solid ${dark ? "#2E2930" : "#E9E4DC"}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: resolvedLabelColor, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: dark ? 32 : 28, fontWeight: 900, letterSpacing: "-.04em", color: dark ? "#FFCE00" : "#1C1820", lineHeight: 1 }}>
        {value}
        {valueIcon}
      </div>
      {delta && <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 5, color: resolvedDeltaColor }}>{delta}</div>}
    </div>
  );
}

// ── Filter tab chip ───────────────────────────────────────────────────────

type MainTab = "my" | "all";

function MainTabSwitch({ active, onChange }: {
  active: MainTab;
  onChange: (tab: MainTab) => void;
}) {
  return (
    <div className="workflows-main-tab-switch" role="tablist" aria-label="Workflow views">
      <button
        type="button"
        role="tab"
        aria-selected={active === "my"}
        className={`workflows-main-tab${active === "my" ? " active" : ""}`}
        onClick={() => onChange("my")}
      >
        <span className="workflows-main-tab-icon" aria-hidden="true">⭐</span>
        My Workflows
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "all"}
        className={`workflows-main-tab${active === "all" ? " active" : ""}`}
        onClick={() => onChange("all")}
      >
        <span className="workflows-main-tab-icon" aria-hidden="true">🗂</span>
        All Workflows
      </button>
    </div>
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

// ── Category dropdown ─────────────────────────────────────────────────────

function CategoryDropdown({ categories, selected, onChange }: {
  categories: [string, number][];
  selected: string | null;
  onChange: (cat: string | null) => void;
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

  const label = selected ?? "Categories";

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
          <rect x="1" y="3" width="14" height="2.5" rx="1.2" />
          <rect x="3" y="7.5" width="10" height="2.5" rx="1.2" />
          <rect x="5.5" y="12" width="5" height="2.5" rx="1.2" />
        </svg>
        {label}
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"
          style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.6 }}>
          <path d="M2 4l4 4 4-4" />
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
            onMouseEnter={e => { if (selected !== null) (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
            onMouseLeave={e => { if (selected !== null) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <span>All Categories</span>
            {selected === null && <span style={{ fontSize: 12, color: "#623CEA" }}>✓</span>}
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: "#F0EBE3", margin: "4px 6px" }} />

          {categories.map(([cat, count]) => {
            const active = selected === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => { onChange(cat); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  border: "none", background: active ? "rgba(98,60,234,.08)" : "transparent",
                  color: active ? "#623CEA" : "#1C1820",
                  fontSize: 13, fontWeight: active ? 800 : 600,
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  transition: "background .1s",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--bg)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span style={{ flex: 1, marginRight: 8 }}>{cat}</span>
                <span style={{
                  fontSize: 10.5, fontWeight: 700,
                  color: active ? "#623CEA" : "#A09AA6",
                  background: active ? "rgba(98,60,234,.1)" : "var(--bg)",
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

// ── Category card (exact replica of main app) ────────────────────────────

function CategoryCard({ name, count, description, thumbnail, onClick }: { name: string; count: number; description?: string | null; thumbnail?: string | null; onClick: () => void }) {
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
      <div className={`card-poster category-card-poster ${theme.posterColor}${thumbnail ? " has-thumbnail" : ""}`}>
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="card-thumbnail" src={thumbnail} alt="" />
        ) : (
          <Scene theme={theme} />
        )}
      </div>
      <div className="card-body category-card-body">
        <div className="meta-line">
          <span className="category-card-count">{countLabel}</span>
        </div>
        <h3 className="card-title">{name}</h3>
        {description && <p className="card-desc">{description}</p>}
        <div className="category-card-footer">
          <span className="category-card-cta">Try it →</span>
        </div>
      </div>
    </div>
  );
}

// ── Categories grid ───────────────────────────────────────────────────────

function CategoriesGrid({ activities, selectedTool, onSelect, categoryThumbnails, categoryDescriptions }: {
  activities: Activity[];
  selectedTool: string | null;
  onSelect: (cat: string) => void;
  categoryThumbnails: Record<string, string>;
  categoryDescriptions: Record<string, string>;
}) {
  const categories = useMemo(() => {
    const src = selectedTool
      ? activities.filter(a => normalizeActivityTools(a.tools).some(t => t.toLowerCase() === selectedTool.toLowerCase()))
      : activities;
    const map = new Map<string, number>();
    src.forEach(a => (a.categories ?? []).forEach(cat => { const k = cat.trim(); if (k) map.set(k, (map.get(k) ?? 0) + 1); }));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [activities, selectedTool]);

  if (categories.length === 0) return (
    <div className="static-grid-empty">No workflow types found{selectedTool ? ` for ${formatToolLabel(selectedTool)}` : ""}.</div>
  );

  return (
    <div className="static-grid">
      {categories.map(([cat, count]) => {
        const key = cat.toLowerCase();
        return (
          <div key={cat} className="static-grid-slot">
            <CategoryCard
              name={cat}
              count={count}
              thumbnail={categoryThumbnails[key] ?? null}
              description={categoryDescriptions[key] ?? null}
              onClick={() => onSelect(cat)}
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

      <section style={{ padding: "32px 28px 40px", borderTop: "1px solid #E9E4DC", background: "var(--bg)" }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ position: "relative", paddingLeft: 22 }}>
            <div style={{ position: "absolute", left: 0, top: 4, width: 7, height: 58, borderRadius: 999, background: "#FFCE00", border: "1px solid rgba(28,24,32,.18)" }} />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "#746F78", marginBottom: 4 }}>Learn</div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-.04em", color: "#1C1820" }}>AI Foundations</h2>
            <p style={{ margin: "6px 0 0", color: "#6B6670", fontSize: 13.5, fontWeight: 600, lineHeight: 1.45 }}>Short explainers that build practical AI fluency.</p>
          </div>
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
  userId: string | null;
  viewCounts: Record<string, number>;
  completedIds: Set<string>;
  inProgressIds: Set<string>;
  savedWorkflowIds: Set<string>;
  totalAvailable: number;
  completedCount: number;
  inProgressCount: number;
  userTotalPoints: number;
  companyPercentile: number | null;
  companySize: number;
  companyAvgPoints: number;
  streakCount: number;
  modules: FoundationModule[];
  categoryThumbnails: Record<string, string>;
  categoryDescriptions: Record<string, string>;
  workflowsConfirmed: boolean;
  preferredToolSlug: string | null;
};

export default function WorkflowsClient({ activities, toolLogos, tagLogos, userId, viewCounts, completedIds, inProgressIds, savedWorkflowIds, totalAvailable, completedCount, inProgressCount, userTotalPoints, companyPercentile, companySize, companyAvgPoints, streakCount, modules, categoryThumbnails, categoryDescriptions, workflowsConfirmed: workflowsConfirmedInitial, preferredToolSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get("tag");
  const [activeMainTab, setActiveMainTab] = useState<"my" | "all">("my");
  const [preferencesConfirmed, setPreferencesConfirmed] = useState(workflowsConfirmedInitial);
  const [confirmingPreferences, setConfirmingPreferences] = useState(false);
  const [navigatingToPreferences, setNavigatingToPreferences] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [extraRows, setExtraRows] = useState(0);
  const COLS = 4;

  const myWorkflows = useMemo(
    () => activities.filter(a => savedWorkflowIds.has(a.id) && !dismissedIds.has(a.id)),
    [activities, savedWorkflowIds, dismissedIds]
  );

  function dismissSavedWorkflow(activityId: string) {
    if (preferencesConfirmed) return;
    setDismissedIds(prev => new Set(prev).add(activityId));
    if (!userId) return;
    // keepalive so the request survives a fast click-then-refresh — a plain
    // fetch (or the supabase-js client, which doesn't expose keepalive) can
    // get cancelled mid-flight by page navigation before it reaches the server.
    void fetch("/api/workflows/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId }),
      keepalive: true,
    }).catch(() => {});
  }

  async function confirmPreferences() {
    if (confirmingPreferences || preferencesConfirmed) return;
    setConfirmingPreferences(true);
    setPreferencesConfirmed(true);
    try {
      const res = await fetch("/api/workflows/confirm", { method: "POST", keepalive: true });
      if (!res.ok) setPreferencesConfirmed(false);
    } catch {
      setPreferencesConfirmed(false);
    } finally {
      setConfirmingPreferences(false);
    }
  }

  useEffect(() => {
    setPreferencesConfirmed(workflowsConfirmedInitial);
  }, [workflowsConfirmedInitial]);

  function clearTagFilter() {
    router.replace("/workflows", { scroll: false });
  }

  const showActivities = !!selectedCategory || !!searchQuery.trim() || !!selectedTool || !!selectedTag;

  const allTools = useMemo(() => {
    const s = new Set<string>();
    activities.forEach(a => normalizeActivityTools(a.tools).forEach(t => s.add(t)));
    return [...s];
  }, [activities]);

  const allCategories = useMemo((): [string, number][] => {
    const map = new Map<string, number>();
    activities.forEach(a => (a.categories ?? []).forEach(c => { if (c) map.set(c, (map.get(c) ?? 0) + 1); }));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [activities]);

  const filtered = useMemo(() => {
    let result = activities;
    if (selectedTool) result = result.filter(a => normalizeActivityTools(a.tools).includes(selectedTool));
    if (selectedCategory) result = result.filter(a => (a.categories ?? []).some(c => c.toLowerCase() === selectedCategory.toLowerCase()));
    if (selectedTag) result = result.filter(a => activityHasTag(a, selectedTag));
    const q = searchQuery.trim().toLowerCase();
    if (q) result = result.filter(a =>
      a.title.toLowerCase().includes(q) ||
      (a.description ?? "").toLowerCase().includes(q) ||
      normalizeActivityTools(a.tools).some(t => formatToolLabel(t).toLowerCase().includes(q))
    );
    return result;
  }, [activities, selectedTool, selectedCategory, selectedTag, searchQuery, completedIds, inProgressIds]);

  const visibleCount = COLS * (2 + extraRows);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => { setExtraRows(0); }, [selectedTool, selectedCategory, selectedTag, searchQuery]);

  useEffect(() => {
    if (!selectedTag) return;
    const el = document.getElementById("all-workflows");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedTag]);

  const topPercentileLabel = formatTopPercentile(companyPercentile, companySize);
  const percentileDelta = companySize > 0
    ? `Company avg: ${companyAvgPoints} pts`
    : "Points rank within your company";

  const sectionTitle = selectedTag
    ? selectedTag
    : selectedCategory
      ? selectedCategory
      : "All Workflows";

  const sectionDesc = selectedTag
    ? `${filtered.length} workflow${filtered.length !== 1 ? "s" : ""} tagged with ${selectedTag}`
    : selectedCategory
      ? `${filtered.length} workflow${filtered.length !== 1 ? "s" : ""} in ${selectedCategory}`
      : "Browse every guided workflow in the library. Filter by tool or category to find what fits your work.";

  return (
    <>
      <B2BTopbar
        searchQuery={searchQuery}
        onSearch={q => { clearTagFilter(); setSearchQuery(q); setSelectedCategory(null); }}
        newActivities={activities.filter(a => a.is_featured).slice(0, 8).map(a => ({ id: a.id, title: a.title, tools: a.tools, description: (a as any).description ?? null }))}
        activeTag={selectedTag}
      />

      <div style={{ flex: 1, background: "var(--bg)" }}>
        {/* Page header */}
        <div style={{ background: "var(--bg)", padding: "22px 28px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-.03em", color: "#1C1820", lineHeight: 1.1 }}>Workflows</h1>
              <p style={{ fontSize: 13.5, color: "#746F78", fontWeight: 600, marginTop: 4 }}>Guided AI automations tailored to your tool stack and job category.</p>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", borderRadius: 999, padding: "5px 12px", background: "rgba(98,60,234,.08)", color: "#623CEA", border: "1px solid rgba(98,60,234,.18)", whiteSpace: "nowrap" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#623CEA", display: "inline-block" }} />
              Updated this week
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12, paddingBottom: 18, borderBottom: "1px solid #E9E4DC" }}>
            <StatCard
              label="💰 My Points"
              value={String(userTotalPoints)}
              delta={userTotalPoints > 0 ? "Earned from completed workflows" : "Complete workflows to earn points"}
            />
            <StatCard label="✅ Completed" value={String(completedCount)} delta={`${inProgressCount} in progress`} deltaColor={inProgressCount > 0 ? "#F68A29" : undefined} />
            <StatCard label="⭐ My Workflows" value={String(myWorkflows.length)} delta={myWorkflows.length > 0 ? "Tailored to your stack" : "Update preferences to get started"} deltaColor={myWorkflows.length > 0 ? "#3699FC" : undefined} />
            <StatCard
              label="Weekly Streak"
              value={String(streakCount)}
              valueIcon={<FireIcon size={28} color="#F68A29" />}
              delta={
                streakCount === 0
                  ? "Complete a workflow to start"
                  : streakCount === 1
                    ? "Streak started"
                    : `${streakCount} weeks in a row`
              }
              deltaColor="#623CEA"
            />
            <StatCard label="Company Rank" value={topPercentileLabel} delta={percentileDelta} dark />
          </div>
        </div>

        {/* Main tab switcher */}
        <div className="ndb-root workflows-main-tab-bar">
          <MainTabSwitch active={activeMainTab} onChange={setActiveMainTab} />
          <div className="workflows-main-tab-bar-end">
            {activeMainTab === "my" && (
              <Link
                href="/onboarding"
                className="workflows-main-tab-action"
                onClick={() => setNavigatingToPreferences(true)}
                style={navigatingToPreferences ? { opacity: 0.75, pointerEvents: "none" } : undefined}
                aria-disabled={navigatingToPreferences}
              >
                {navigatingToPreferences ? (
                  <>
                    <span style={{
                      width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                      border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff",
                      animation: "cardNavSpin .65s linear infinite",
                    }} />
                    Loading…
                  </>
                ) : (
                  <>⚙️ Update My Preferences</>
                )}
              </Link>
            )}
          </div>
        </div>

        {activeMainTab === "all" && (
          <>
            {/* Filter bar */}
            <div style={{ background: "var(--bg)", padding: "18px 28px 20px" }}>
              <div className="ndb-root" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Chips — scrollable row */}
                <div className="workflows-filter-bar" style={{ flex: 1, minWidth: 0 }}>
                  {allTools.map(tool => (
                    <ToolChip
                      key={tool}
                      tool={tool}
                      selected={selectedTool === tool}
                      toolLogos={toolLogos}
                      onClick={() => { clearTagFilter(); setSelectedTool(selectedTool === tool ? null : tool); setSelectedCategory(null); }}
                    />
                  ))}
                </div>
                {/* Categories dropdown — always visible on the right, outside the scroll container */}
                <div style={{ flexShrink: 0, position: "relative", zIndex: 200 }}>
                  <CategoryDropdown
                    categories={allCategories}
                    selected={selectedCategory}
                    onChange={cat => { clearTagFilter(); setSelectedCategory(cat); }}
                  />
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="ndb-root" style={{ padding: "0 28px" }}>

              {/* Categories grid — shown when no active filter */}
              {!showActivities && (
                <section className="rail">
                  <div className="rail-header">
                    <div className="rail-title">
                      <span className="section-label">Workflow types</span>
                      <h2>Browse Workflows by Outcome</h2>
                      <p>Pick a workflow type to see all guided activities for that category.</p>
                    </div>
                  </div>
                  <CategoriesGrid
                    activities={activities}
                    selectedTool={selectedTool}
                    onSelect={cat => { clearTagFilter(); setSelectedCategory(cat); }}
                    categoryThumbnails={categoryThumbnails}
                    categoryDescriptions={categoryDescriptions}
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
                    {selectedCategory && !selectedTag && (
                      <button
                        onClick={() => setSelectedCategory(null)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700, color: "#623CEA", background: "rgba(98,60,234,.07)", border: "1px solid rgba(98,60,234,.18)", borderRadius: 7, cursor: "pointer", padding: "7px 13px", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0, marginTop: 4 }}
                      >
                        ← All Categories
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
                            <ActivityCard activity={a} toolLogos={toolLogos} tagLogos={tagLogos} viewCount={viewCounts[a.id] ?? 0} isCompleted={completedIds.has(a.id)} onlyTool={selectedTool} />
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
          </>
        )}

        {activeMainTab === "my" && (
          <div className="ndb-root" style={{ padding: "18px 28px 0" }}>
            <section className="rail">
              <div className="rail-header">
                <div className="rail-title">
                  <span className="section-label">Built for you</span>
                  <h2>My Workflows</h2>
                  <p>Based on what you told us during onboarding.</p>
                </div>
              </div>

              {myWorkflows.length === 0 ? (
                <div className="static-grid-empty">
                  No personalized workflows yet. Switch to All Workflows to browse the library.
                </div>
              ) : (
                <>
                  {!preferencesConfirmed && (
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                      background: "#FFF6CF", borderRadius: 12, padding: "14px 20px", marginBottom: 20,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1C1820" }}>
                        These workflows are AI-suggested based on your answers. Remove any that don&apos;t fit, then confirm.
                      </div>
                      <button
                        onClick={confirmPreferences}
                        disabled={confirmingPreferences}
                        style={{
                          background: "#23CE68", color: "white", border: "none", borderRadius: 999,
                          padding: "9px 20px", fontSize: 13, fontWeight: 700, cursor: confirmingPreferences ? "wait" : "pointer", flexShrink: 0,
                          opacity: confirmingPreferences ? 0.7 : 1,
                        }}
                      >
                        ✓ Accept as Final
                      </button>
                    </div>
                  )}
                  <div className="static-grid">
                    {myWorkflows.map(a => (
                      <div key={a.id} className="static-grid-slot" style={{ position: "relative" }}>
                        {!preferencesConfirmed && (
                          <button
                            type="button"
                            onClick={e => { e.preventDefault(); e.stopPropagation(); dismissSavedWorkflow(a.id); }}
                            title="Remove from My Workflows"
                            style={{
                              position: "absolute", top: 10, right: 10, zIndex: 20,
                              width: 26, height: 26, borderRadius: "50%",
                              background: "rgba(255,255,255,.92)", border: "1px solid #E8E6DC",
                              color: "#221D23", fontSize: 13, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            ✕
                          </button>
                        )}
                        <ActivityCard
                          activity={a}
                          toolLogos={toolLogos}
                          tagLogos={tagLogos}
                          viewCount={viewCounts[a.id] ?? 0}
                          isCompleted={completedIds.has(a.id)}
                          onlyTool={preferredToolSlug}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {/* AI Foundations */}
        <AIFoundationsSection modules={modules} />
      </div>
    </>
  );
}

"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AI_UPDATES_PAGE_NAME, WORKFLOWS_PAGE_NAME } from "@/lib/site";

type ViewRow = {
  id: string; entity_type: string; entity_id: string;
  user_id: string | null; session_id: string | null;
  ip_address: string | null; created_at: string;
};
type ProfileRow  = { id: string; email: string | null; full_name: string | null };
type ModuleRow   = { id: string; title: string; emoji: string; published: boolean };
type VideoRow    = { id: string; title: string; is_published: boolean };
type DeepDiveRow = { id: string; title: string; published: boolean };
type ToolRow     = { id: string; name: string };


const card: React.CSSProperties = {
  background: "white", border: "1px solid #E8E6DC", borderRadius: 18,
  boxShadow: "0 2px 12px rgba(34,29,35,.06)", padding: "20px 24px",
};
const btnGhost: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 999, border: "1.5px solid #E8E6DC",
  background: "white", color: "#221D23", fontWeight: 700, fontSize: 13, cursor: "pointer",
};
const inp: React.CSSProperties = {
  padding: "8px 12px", borderRadius: 10, border: "1.5px solid #E8E6DC",
  fontSize: 13, outline: "none", background: "white", color: "#221D23",
};

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ ...card, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9B9490", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-.05em", color: color ?? "#221D23" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#B0ABA5" }}>{sub}</div>}
    </div>
  );
}

function BarChart({ items, maxCount }: { items: { label: string; count: number; color?: string }[]; maxCount: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map(item => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 180, fontSize: 12.5, fontWeight: 600, color: "#221D23", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flexShrink: 0 }}>{item.label}</div>
          <div style={{ flex: 1, background: "#F0EEE8", borderRadius: 999, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0}%`, height: "100%", background: item.color ?? "#5030C0", borderRadius: 999, transition: "width .3s" }} />
          </div>
          <div style={{ width: 40, textAlign: "right", fontSize: 12.5, fontWeight: 700, color: "#6B6B6B", flexShrink: 0 }}>{item.count}</div>
        </div>
      ))}
    </div>
  );
}

function DailyTrafficBarChart({ data, color = "#5030C0" }: { data: { date: string; count: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const BAR_H = 180;
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: BAR_H + 52, paddingTop: 8 }}>
      {data.map((d, i) => {
        const barH = Math.round((d.count / max) * BAR_H);
        const showDate = i === 0 || i === data.length - 1 || i % labelEvery === 0;
        return (
          <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: d.count > 0 ? "#221D23" : "transparent", marginBottom: 4, lineHeight: 1 }}>
              {d.count > 0 ? d.count : "·"}
            </div>
            <div style={{ width: "100%", maxWidth: 28, height: BAR_H, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <div style={{
                width: "75%", height: Math.max(barH, d.count > 0 ? 4 : 0),
                background: d.count > 0 ? color : "#E8E6DC",
                borderRadius: "5px 5px 0 0",
                transition: "height .3s",
              }} />
            </div>
            <div style={{
              fontSize: 9, color: "#B0ABA5", marginTop: 8, fontWeight: 600,
              visibility: showDate ? "visible" : "hidden", whiteSpace: "nowrap",
            }}>
              {d.date.slice(5)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  video: "#EF4444", module: "#5030C0", tool: "#17A855", tool_guide: "#F68A29", deep_dive: "#1A7FD4", page: "#9B9490",
};
const TYPE_LABELS: Record<string, string> = {
  video: "Videos", module: "Modules", tool: "Tools", tool_guide: "Tool Guides", deep_dive: "Deep Dives", page: "Pages",
};

function visitorKey(v: ViewRow): string {
  return v.user_id ?? v.ip_address ?? v.session_id ?? v.id;
}

const CHART_DAY_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "15 days", value: 15 },
  { label: "1 month", value: 30 },
] as const;

type ChartDays = (typeof CHART_DAY_OPTIONS)[number]["value"];

function buildDayRange(dayCount: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = dayCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export default function KnowAnalyticsClient() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [realOnly, setRealOnly] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [chartDays, setChartDays] = useState<ChartDays>(30);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    modules: ModuleRow[]; videos: VideoRow[]; deepDives: DeepDiveRow[];
    tools: ToolRow[]; views: ViewRow[]; profiles: ProfileRow[];
  }>({ modules: [], videos: [], deepDives: [], tools: [], views: [], profiles: [] });

  async function fetchData(fromDate: string, toDate: string, ro: boolean) {
    setLoading(true);
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (ro) params.set("realOnly", "true");
    const res = await fetch(`/api/superadmin/analytics/know?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchData(from, to, true); }, []);

  function apply() { fetchData(from, to, realOnly); }

  const { modules, videos, deepDives, tools, views, profiles } = data;

  const profileMap = useMemo(() => {
    const m: Record<string, ProfileRow> = {};
    profiles.forEach(p => { m[p.id] = p; });
    return m;
  }, [profiles]);

  const moduleMap   = useMemo(() => { const m: Record<string, string> = {}; modules.forEach(x => { m[x.id] = `${x.emoji} ${x.title}`; }); return m; }, [modules]);
  const videoMap    = useMemo(() => { const m: Record<string, string> = {}; videos.forEach(x => { m[x.id] = x.title; }); return m; }, [videos]);
  const deepDiveMap = useMemo(() => { const m: Record<string, string> = {}; deepDives.forEach(x => { m[x.id] = x.title; }); return m; }, [deepDives]);
  const toolMap     = useMemo(() => { const m: Record<string, string> = {}; tools.forEach(x => { m[x.id] = x.name; }); return m; }, [tools]);

  function getLabel(type: string, id: string): string {
    if (type === "module")     return moduleMap[id]   ?? `Module ${id.slice(0, 6)}`;
    if (type === "video")      return videoMap[id]    ?? `Video ${id.slice(0, 6)}`;
    if (type === "deep_dive")  return deepDiveMap[id] ?? `Deep Dive ${id.slice(0, 6)}`;
    if (type === "tool")       return toolMap[id]     ?? `Tool ${id.slice(0, 6)}`;
    if (type === "tool_guide") return deepDiveMap[id] ?? toolMap[id] ?? `Guide ${id.slice(0, 6)}`;
    return `${TYPE_LABELS[type] ?? type} ${id.slice(0, 6)}`;
  }

  const filteredViews = useMemo(() =>
    typeFilter === "all" ? views : views.filter(v => v.entity_type === typeFilter),
  [views, typeFilter]);

  const seedCount     = useMemo(() => views.filter(v => !v.ip_address).length, [views]);
  const totalViews    = filteredViews.length;
  const uniqueVisitors = useMemo(() => new Set(filteredViews.map(visitorKey)).size, [filteredViews]);
  const uniqueIPs      = useMemo(() => new Set(filteredViews.map(v => v.ip_address).filter(Boolean)).size, [filteredViews]);
  const uniqueUsers    = useMemo(() => new Set(filteredViews.map(v => v.user_id).filter(Boolean)).size, [filteredViews]);

  const byType = useMemo(() => {
    const m: Record<string, number> = {};
    views.forEach(v => { m[v.entity_type] = (m[v.entity_type] ?? 0) + 1; });
    return Object.entries(m).sort(([, a], [, b]) => b - a);
  }, [views]);

  const topContent = useMemo(() => {
    const m: Record<string, { type: string; count: number }> = {};
    filteredViews.forEach(v => {
      const key = `${v.entity_type}::${v.entity_id}`;
      if (!m[key]) m[key] = { type: v.entity_type, count: 0 };
      m[key].count++;
    });
    return Object.entries(m).sort(([, a], [, b]) => b.count - a.count).slice(0, 15)
      .map(([key, { type, count }]) => ({
        id: key.split("::")[1], type, count, label: getLabel(type, key.split("::")[1]),
      }));
  }, [filteredViews, moduleMap, videoMap, deepDiveMap]);

  const maxCount = topContent[0]?.count ?? 1;

  const usersByDay = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    filteredViews.forEach(v => {
      const day = v.created_at.slice(0, 10);
      if (!m[day]) m[day] = new Set();
      m[day].add(visitorKey(v));
    });
    return buildDayRange(chartDays).map(d => ({ date: d, count: m[d]?.size ?? 0 }));
  }, [filteredViews, chartDays]);

  const peakDay = usersByDay.reduce((best, d) => d.count > best.count ? d : best, { date: "", count: 0 });

  const userViews = useMemo(() => {
    const m: Record<string, number> = {};
    filteredViews.filter(v => v.user_id).forEach(v => { m[v.user_id!] = (m[v.user_id!] ?? 0) + 1; });
    return Object.entries(m).sort(([, a], [, b]) => b - a).slice(0, 20)
      .map(([uid, count]) => ({ uid, count, profile: profileMap[uid] }));
  }, [filteredViews, profileMap]);

  const ipViews = useMemo(() => {
    const m: Record<string, number> = {};
    filteredViews.filter(v => !v.user_id && v.ip_address).forEach(v => { m[v.ip_address!] = (m[v.ip_address!] ?? 0) + 1; });
    return Object.entries(m).sort(([, a], [, b]) => b - a).slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
  }, [filteredViews]);

  return (
    <div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <Link href="/superadmin" style={{ color: "#9B9490", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Superadmin</Link>
              <span style={{ color: "#D0CCC6" }}>/</span>
              <Link href="/superadmin/analytics" style={{ color: "#9B9490", textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Analytics</Link>
              <span style={{ color: "#D0CCC6" }}>/</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#221D23" }}>{AI_UPDATES_PAGE_NAME}</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-.05em" }}>{AI_UPDATES_PAGE_NAME} Analytics</h1>
            <p style={{ margin: "4px 0 0", color: "#6B6B6B", fontSize: 13 }}>Fluency content views — tracked by user ID and IP for logged-in and anonymous visitors</p>
          </div>
          <Link href="/superadmin/analytics/apply" style={{ ...btnGhost, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            Switch → {WORKFLOWS_PAGE_NAME}
          </Link>
        </div>

        {/* Filters */}
        <div style={{ ...card, marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "14px 20px" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#221D23" }}>Filter</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#6B6B6B", fontWeight: 600 }}>From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inp} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#6B6B6B", fontWeight: 600 }}>To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inp} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ fontSize: 12, color: "#6B6B6B", fontWeight: 600 }}>Type</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...inp, paddingRight: 28 }}>
              <option value="all">All types</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#221D23" }}>
            <input type="checkbox" checked={realOnly} onChange={e => setRealOnly(e.target.checked)} style={{ accentColor: "#5030C0", width: 15, height: 15 }} />
            Exclude seed data (real traffic only)
          </label>
          <button onClick={apply} style={{ padding: "8px 16px", borderRadius: 999, border: "1.5px solid #5030C0", background: "#5030C0", color: "white", fontWeight: 900, fontSize: 13, cursor: "pointer" }} disabled={loading}>
            {loading ? "Loading…" : "Apply"}
          </button>
          {(from || to || realOnly || typeFilter !== "all") && (
            <button onClick={() => { setFrom(""); setTo(""); setRealOnly(false); setTypeFilter("all"); fetchData("", "", false); }} style={btnGhost}>Clear</button>
          )}
          {loading && <span style={{ fontSize: 12, color: "#9B9490" }}>Fetching…</span>}
        </div>

        {/* Seed note */}
        {!realOnly && seedCount > 0 && (
          <div style={{ marginBottom: 20, padding: "10px 16px", background: "rgba(80,48,192,.08)", border: "1px solid rgba(80,48,192,.2)", borderRadius: 10, fontSize: 12.5, color: "#3A2080" }}>
            <strong>Includes seed data:</strong> {seedCount.toLocaleString()} rows have no IP address (inserted by the seed script). Toggle <strong>Exclude seed data</strong> to see real traffic only.
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Views" value={totalViews.toLocaleString()} sub={typeFilter === "all" ? "all content types" : TYPE_LABELS[typeFilter]} color="#5030C0" />
          <StatCard label="Unique Visitors" value={uniqueVisitors.toLocaleString()} sub={`${uniqueIPs} by IP · ${uniqueUsers} logged in`} />
          <StatCard label="Content Types" value={byType.length} sub={byType.slice(0, 2).map(([t, c]) => `${TYPE_LABELS[t] ?? t}: ${c}`).join(" · ")} />
          <StatCard label="Top Content" value={topContent[0]?.label.slice(0, 20) ?? "—"} sub={topContent[0] ? `${topContent[0].count} views` : ""} color="#EF4444" />
        </div>

        {/* Daily traffic chart */}
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 16, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 900, letterSpacing: "-.03em" }}>Daily Traffic</h2>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9B9490" }}>Unique visitors per day</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 6 }}>
                {CHART_DAY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setChartDays(opt.value)}
                    style={{
                      padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      border: chartDays === opt.value ? "1.5px solid #5030C0" : "1.5px solid #E8E6DC",
                      background: chartDays === opt.value ? "rgba(80,48,192,.1)" : "white",
                      color: "#221D23",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {peakDay.count > 0 && (
                <span style={{ fontSize: 11.5, color: "#6B6B6B", fontWeight: 600 }}>
                  Peak: {peakDay.count} users on {peakDay.date}
                </span>
              )}
            </div>
          </div>
          {usersByDay.every(d => d.count === 0)
            ? <p style={{ color: "#B0ABA5", fontSize: 13 }}>No data in selected range.</p>
            : <DailyTrafficBarChart data={usersByDay} color="#5030C0" />
          }
        </div>

        {/* Top content bar chart */}
        <div style={{ ...card, marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 900, letterSpacing: "-.03em" }}>
            Top Content by Views {typeFilter !== "all" && `— ${TYPE_LABELS[typeFilter] ?? typeFilter}`}
          </h2>
          {topContent.length === 0
            ? <p style={{ color: "#B0ABA5", fontSize: 13 }}>No data in selected range.</p>
            : <BarChart maxCount={maxCount} items={topContent.map(c => ({ label: c.label, count: c.count, color: TYPE_COLORS[c.type] ?? "#6B6B6B" }))} />
          }
        </div>

        {/* Full table */}
        <div style={{ ...card, marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 900, letterSpacing: "-.03em" }}>All Content — View Counts</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #F0EEE8" }}>
                  {["Content", "Type", "Views", "Logged-in", "By IP"].map(h => (
                    <th key={h} style={{ textAlign: h === "Content" || h === "Type" ? "left" : "right", padding: "8px 12px", color: "#9B9490", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topContent.map(c => {
                  const loggedIn = filteredViews.filter(v => v.entity_type === c.type && v.entity_id === c.id && v.user_id).length;
                  const byIp     = filteredViews.filter(v => v.entity_type === c.type && v.entity_id === c.id && v.ip_address && !v.user_id).length;
                  return (
                    <tr key={`${c.type}::${c.id}`} style={{ borderBottom: "1px solid #F6F4EE" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#221D23" }}>{c.label}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: `${TYPE_COLORS[c.type] ?? "#6B6B6B"}18`, color: TYPE_COLORS[c.type] ?? "#6B6B6B" }}>
                          {TYPE_LABELS[c.type] ?? c.type}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{c.count.toLocaleString()}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#17A855", fontWeight: 700 }}>{loggedIn}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#1A7FD4", fontWeight: 700 }}>{byIp}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* User breakdown row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {userViews.length > 0 && (
            <div style={card}>
              <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 900, letterSpacing: "-.03em" }}>Logged-in Users</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #F0EEE8" }}>
                    <th style={{ textAlign: "left", padding: "6px 10px", color: "#9B9490", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>User</th>
                    <th style={{ textAlign: "right", padding: "6px 10px", color: "#9B9490", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Views</th>
                    <th style={{ textAlign: "right", padding: "6px 10px", color: "#9B9490", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {userViews.map(({ uid, count, profile: p }) => {
                    const lastView = filteredViews.filter(v => v.user_id === uid).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
                    return (
                      <tr key={uid} style={{ borderBottom: "1px solid #F6F4EE" }}>
                        <td style={{ padding: "9px 10px" }}>
                          <div style={{ fontWeight: 600, color: "#221D23", fontSize: 13 }}>{p?.full_name ?? p?.email ?? uid.slice(0, 8) + "…"}</div>
                          {p?.full_name && p?.email && <div style={{ fontSize: 11, color: "#9B9490" }}>{p.email}</div>}
                        </td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700 }}>{count}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", color: "#9B9490", fontSize: 12 }}>
                          {lastView ? new Date(lastView.created_at).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {ipViews.length > 0 && (
            <div style={card}>
              <h2 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 900, letterSpacing: "-.03em" }}>Anonymous Visitors (by IP)</h2>
              <p style={{ margin: "0 0 14px", fontSize: 12, color: "#9B9490" }}>Top {ipViews.length} IPs with no login</p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #F0EEE8" }}>
                    <th style={{ textAlign: "left", padding: "6px 10px", color: "#9B9490", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>IP Address</th>
                    <th style={{ textAlign: "right", padding: "6px 10px", color: "#9B9490", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Views</th>
                    <th style={{ textAlign: "right", padding: "6px 10px", color: "#9B9490", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {ipViews.map(({ ip, count }) => {
                    const lastView = filteredViews.filter(v => v.ip_address === ip && !v.user_id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
                    return (
                      <tr key={ip} style={{ borderBottom: "1px solid #F6F4EE" }}>
                        <td style={{ padding: "9px 10px", fontFamily: "monospace", fontSize: 12.5, color: "#221D23", fontWeight: 600 }}>{ip}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700 }}>{count}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", color: "#9B9490", fontSize: 12 }}>
                          {lastView ? new Date(lastView.created_at).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

    </div>
  );
}

"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AI_UPDATES_PAGE_NAME, WORKFLOWS_PAGE_NAME } from "@/lib/site";

type ActivityRow = { id: string; title: string; category: string; published: boolean };
type ViewRow = {
  id: string; activity_id: string;
  user_id: string | null; session_id: string | null;
  ip_address: string | null; created_at: string;
};
type ProgressRow = { id: string; user_id: string; activity_id: string; status: string; quiz_score: number | null; completed_at: string | null; updated_at: string };
type ProfileRow = { id: string; email: string | null; full_name: string | null };

const card: React.CSSProperties = {
  background: "white", border: "1px solid #E8E6DC", borderRadius: 18,
  boxShadow: "0 2px 12px rgba(34,29,35,.06)", padding: "20px 24px",
};
const btnGhost: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 999, border: "1.5px solid #E8E6DC",
  background: "white", color: "#221D23", fontWeight: 700, fontSize: 13, cursor: "pointer",
};
const btnAmber: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 999, border: "1.5px solid #FFCE00",
  background: "#FFCE00", color: "#221D23", fontWeight: 900, fontSize: 13, cursor: "pointer",
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

function DailyTrafficBarChart({ data, color = "#FFCE00" }: { data: { date: string; count: number }[]; color?: string }) {
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

const CAT_COLORS: Record<string, string> = {
  chat: "#6240EA", build: "#23CE68", automate: "#F68A29",
};

// Derive a stable visitor key: prefer user_id, then IP, then session_id
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

export default function ApplyAnalyticsClient() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [realOnly, setRealOnly] = useState(true);
  const [chartDays, setChartDays] = useState<ChartDays>(30);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    activities: ActivityRow[];
    views: ViewRow[];
    progress: ProgressRow[];
    profiles: ProfileRow[];
  }>({ activities: [], views: [], progress: [], profiles: [] });

  async function fetchData(fromDate: string, toDate: string, ro: boolean) {
    setLoading(true);
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (ro) params.set("realOnly", "true");
    const res = await fetch(`/api/superadmin/analytics/apply?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchData(from, to, true); }, []);

  function apply() { fetchData(from, to, realOnly); }

  const { activities, views, progress, profiles } = data;

  const profileMap = useMemo(() => {
    const m: Record<string, ProfileRow> = {};
    profiles.forEach(p => { m[p.id] = p; });
    return m;
  }, [profiles]);

  const viewsByActivity = useMemo(() => {
    const m: Record<string, number> = {};
    views.forEach(v => { m[v.activity_id] = (m[v.activity_id] ?? 0) + 1; });
    return m;
  }, [views]);

  const completionsByActivity = useMemo(() => {
    const m: Record<string, number> = {};
    progress.filter(p => p.status === "completed").forEach(p => { m[p.activity_id] = (m[p.activity_id] ?? 0) + 1; });
    return m;
  }, [progress]);

  const inProgressByActivity = useMemo(() => {
    const m: Record<string, number> = {};
    progress.filter(p => p.status === "in_progress").forEach(p => { m[p.activity_id] = (m[p.activity_id] ?? 0) + 1; });
    return m;
  }, [progress]);

  // Unique visitors: deduplicated by best available key (user_id > ip > session_id)
  const uniqueVisitors = useMemo(() => new Set(views.map(visitorKey)).size, [views]);
  const uniqueIPs      = useMemo(() => new Set(views.map(v => v.ip_address).filter(Boolean)).size, [views]);
  const uniqueUsers    = useMemo(() => new Set(views.map(v => v.user_id).filter(Boolean)).size, [views]);

  const totalViews       = views.length;
  const totalInProgress  = progress.filter(p => p.status === "in_progress").length;
  const totalCompletions = progress.filter(p => p.status === "completed").length;
  const quizScores = progress.filter(p => p.quiz_score != null).map(p => p.quiz_score as number);
  const avgQuiz = quizScores.length ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : 0;

  const usersByDay = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    views.forEach(v => {
      const day = v.created_at.slice(0, 10);
      if (!m[day]) m[day] = new Set();
      m[day].add(visitorKey(v));
    });
    return buildDayRange(chartDays).map(d => ({ date: d, count: m[d]?.size ?? 0 }));
  }, [views, chartDays]);

  const peakDay = usersByDay.reduce((best, d) => d.count > best.count ? d : best, { date: "", count: 0 });

  // Per-user view counts (logged-in users only for the breakdown table)
  const userViews = useMemo(() => {
    const m: Record<string, number> = {};
    views.filter(v => v.user_id).forEach(v => { m[v.user_id!] = (m[v.user_id!] ?? 0) + 1; });
    return Object.entries(m).sort(([, a], [, b]) => b - a).slice(0, 20)
      .map(([uid, count]) => ({ uid, count, profile: profileMap[uid] }));
  }, [views, profileMap]);

  // Per-IP view counts (anonymous visitors)
  const ipViews = useMemo(() => {
    const m: Record<string, number> = {};
    views.filter(v => !v.user_id && v.ip_address).forEach(v => { m[v.ip_address!] = (m[v.ip_address!] ?? 0) + 1; });
    return Object.entries(m).sort(([, a], [, b]) => b - a).slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
  }, [views]);

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
              <span style={{ fontSize: 13, fontWeight: 700, color: "#221D23" }}>{WORKFLOWS_PAGE_NAME}</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-.05em" }}>{WORKFLOWS_PAGE_NAME} Analytics</h1>
            <p style={{ margin: "4px 0 0", color: "#6B6B6B", fontSize: 13 }}>Activity views, completions, and user engagement — tracked by user ID and IP</p>
          </div>
          <Link href="/superadmin/analytics/know" style={{ ...btnGhost, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            Switch → {AI_UPDATES_PAGE_NAME}
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
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#221D23" }}>
            <input type="checkbox" checked={realOnly} onChange={e => setRealOnly(e.target.checked)} style={{ accentColor: "#FFCE00", width: 15, height: 15 }} />
            Exclude seed data (real traffic only)
          </label>
          <button onClick={apply} style={btnAmber} disabled={loading}>
            {loading ? "Loading…" : "Apply"}
          </button>
          {(from || to || realOnly) && (
            <button onClick={() => { setFrom(""); setTo(""); setRealOnly(false); fetchData("", "", false); }} style={btnGhost}>
              Clear
            </button>
          )}
          {loading && <span style={{ fontSize: 12, color: "#9B9490" }}>Fetching…</span>}
        </div>

        {/* Seed data note */}
        {!realOnly && (
          <div style={{ marginBottom: 20, padding: "10px 16px", background: "rgba(255,206,0,.12)", border: "1px solid rgba(255,206,0,.4)", borderRadius: 10, fontSize: 12.5, color: "#7A5F00" }}>
            <strong>Includes seed data:</strong> {views.filter(v => !v.ip_address).length.toLocaleString()} rows have no IP address (inserted by the seed script). Toggle <strong>Exclude seed data</strong> to see real traffic only.
          </div>
        )}

        {/* Summary Stats — funnel */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 24 }}>
          <StatCard label="Opened" value={totalViews.toLocaleString()} sub="workflow page opens" />
          <StatCard label="Unique Visitors" value={uniqueVisitors.toLocaleString()} sub={`${uniqueIPs} by IP · ${uniqueUsers} logged in`} />
          <StatCard label="In Progress" value={totalInProgress.toLocaleString()} sub="started, not finished" color="#F68A29" />
          <StatCard label="Completed" value={totalCompletions.toLocaleString()} sub="finished the workflow" color="#17A855" />
          <StatCard label="Avg Quiz Score" value={avgQuiz ? `${avgQuiz}%` : "—"} sub={`from ${quizScores.length} quizzes`} color="#5030C0" />
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
                      border: chartDays === opt.value ? "1.5px solid #FFCE00" : "1.5px solid #E8E6DC",
                      background: chartDays === opt.value ? "rgba(255,206,0,.15)" : "white",
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
            : <DailyTrafficBarChart data={usersByDay} color="#FFCE00" />
          }
        </div>

        {/* Activity table */}
        <div style={{ ...card, marginBottom: 20 }}>
          <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 900, letterSpacing: "-.03em" }}>All Activities — Engagement Funnel</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #F0EEE8" }}>
                  {["Activity", "Category", "Opened", "In Progress", "Completed", "Completion Rate", "Status"].map(h => (
                    <th key={h} style={{ textAlign: h === "Activity" || h === "Category" || h === "Status" ? "left" : "right", padding: "8px 12px", color: "#9B9490", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...activities].sort((a, b) => (viewsByActivity[b.id] ?? 0) - (viewsByActivity[a.id] ?? 0)).map(act => {
                  const v  = viewsByActivity[act.id] ?? 0;
                  const ip = inProgressByActivity[act.id] ?? 0;
                  const c  = completionsByActivity[act.id] ?? 0;
                  const rate = v > 0 ? Math.round((c / v) * 100) : 0;
                  const catColor = CAT_COLORS[act.category] ?? "#6B6B6B";
                  return (
                    <tr key={act.id} style={{ borderBottom: "1px solid #F6F4EE" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                        <Link href={`/superadmin/activity/${act.id}`} style={{ color: "#221D23", textDecoration: "none" }}
                          onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                          onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>
                          {act.title}
                        </Link>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: `${catColor}18`, color: catColor }}>{act.category}</span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{v.toLocaleString()}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#F68A29", fontWeight: 700 }}>{ip.toLocaleString()}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#17A855", fontWeight: 700 }}>{c.toLocaleString()}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <span style={{ color: rate >= 50 ? "#17A855" : rate >= 20 ? "#B05000" : "#6B6B6B", fontWeight: 700 }}>{v > 0 ? `${rate}%` : "—"}</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: act.published ? "rgba(35,206,104,.1)" : "#F0EEE8", color: act.published ? "#17A855" : "#9B9490" }}>
                          {act.published ? "Published" : "Draft"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users breakdown row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Logged-in users */}
          {userViews.length > 0 && (
            <div style={card}>
              <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 900, letterSpacing: "-.03em" }}>Logged-in Users</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #F0EEE8" }}>
                    <th style={{ textAlign: "left", padding: "6px 10px", color: "#9B9490", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>User</th>
                    <th style={{ textAlign: "right", padding: "6px 10px", color: "#9B9490", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Opened</th>
                    <th style={{ textAlign: "right", padding: "6px 10px", color: "#9B9490", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>In Progress</th>
                    <th style={{ textAlign: "right", padding: "6px 10px", color: "#9B9490", fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>Done</th>
                  </tr>
                </thead>
                <tbody>
                  {userViews.map(({ uid, count, profile: p }) => {
                    const inProg = progress.filter(pr => pr.user_id === uid && pr.status === "in_progress").length;
                    const done   = progress.filter(pr => pr.user_id === uid && pr.status === "completed").length;
                    const lastView = views.filter(v => v.user_id === uid).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
                    return (
                      <tr key={uid} style={{ borderBottom: "1px solid #F6F4EE" }}>
                        <td style={{ padding: "9px 10px" }}>
                          <div style={{ fontWeight: 600, color: "#221D23", fontSize: 13 }}>{p?.full_name ?? p?.email ?? uid.slice(0, 8) + "…"}</div>
                          {p?.full_name && p?.email && <div style={{ fontSize: 11, color: "#9B9490" }}>{p.email}</div>}
                          {lastView && <div style={{ fontSize: 10.5, color: "#C0BBB5" }}>last: {new Date(lastView.created_at).toLocaleDateString()}</div>}
                        </td>
                        <td style={{ padding: "9px 10px", textAlign: "right", fontWeight: 700 }}>{count}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", color: "#F68A29", fontWeight: 700 }}>{inProg}</td>
                        <td style={{ padding: "9px 10px", textAlign: "right", color: "#17A855", fontWeight: 700 }}>{done}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Anonymous visitors by IP */}
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
                    const lastView = views.filter(v => v.ip_address === ip && !v.user_id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
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

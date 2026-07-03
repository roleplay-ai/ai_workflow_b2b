"use client";
import { useState, useEffect, useMemo } from "react";

type AnalyticsData = {
  users: any[];
  views: any[];
  progress: any[];
  activities: any[];
  fluencyViews: any[];
  categories: string[];
};

function getDefaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
}

function getDefaultTo() {
  return new Date().toISOString().split("T")[0];
}

function StatMini({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 14, padding: "16px 18px", flex: "1 1 160px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-.04em", color }}>{value}</div>
    </div>
  );
}

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(getDefaultFrom);
  const [to, setTo] = useState(getDefaultTo);
  const [cat, setCat] = useState("");
  const [tab, setTab] = useState<"activities" | "users" | "know">("activities");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (cat) params.set("category", cat);

    fetch(`/api/admin/analytics?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [from, to, cat]);

  const completedCount = data?.progress.filter(p => p.status === "completed").length ?? 0;
  const inProgressCount = data?.progress.filter(p => p.status === "in_progress").length ?? 0;
  const activeUserIds = new Set(data?.progress.map(p => p.user_id) ?? []);
  const totalViews = (data?.views.length ?? 0) + (data?.fluencyViews.length ?? 0);

  const activityStats = useMemo(() => {
    if (!data) return [];
    const map: Record<string, { title: string; views: number; started: number; completed: number; avgQuiz: number; quizCount: number }> = {};

    data.activities.forEach(a => {
      map[a.id] = { title: a.title, views: 0, started: 0, completed: 0, avgQuiz: 0, quizCount: 0 };
    });

    data.views.forEach(v => {
      if (map[v.activity_id]) map[v.activity_id].views++;
    });

    data.progress.forEach(p => {
      if (!map[p.activity_id]) return;
      if (p.status === "completed") map[p.activity_id].completed++;
      else if (p.status === "in_progress") map[p.activity_id].started++;
      if (p.quiz_score != null) {
        map[p.activity_id].avgQuiz += p.quiz_score;
        map[p.activity_id].quizCount++;
      }
    });

    return Object.entries(map)
      .map(([id, s]) => ({
        id,
        ...s,
        avgQuiz: s.quizCount > 0 ? Math.round(s.avgQuiz / s.quizCount) : null,
        completionRate: (s.started + s.completed) > 0 ? Math.round((s.completed / (s.started + s.completed)) * 100) : 0,
      }))
      .sort((a, b) => (b.views + b.completed) - (a.views + a.completed));
  }, [data]);

  const userStats = useMemo(() => {
    if (!data) return [];
    return data.users.map(u => {
      const userProgress = data.progress.filter(p => p.user_id === u.id);
      const userViews = data.views.filter(v => v.user_id === u.id);
      const userFluencyViews = data.fluencyViews.filter(v => v.user_id === u.id);
      const completed = userProgress.filter(p => p.status === "completed").length;
      const inProg = userProgress.filter(p => p.status === "in_progress").length;

      const allDates = [
        ...userViews.map(v => v.created_at?.split("T")[0]),
        ...userFluencyViews.map(v => v.created_at?.split("T")[0]),
      ].filter(Boolean);
      const activeDays = new Set(allDates).size;

      const lastActive = userProgress.reduce((latest: string | null, p: any) => {
        const d = p.completed_at || p.updated_at;
        return !latest || (d && d > latest) ? d : latest;
      }, null);

      return {
        ...u,
        completed,
        inProgress: inProg,
        totalViews: userViews.length + userFluencyViews.length,
        activeDays,
        lastActive,
      };
    }).sort((a, b) => b.totalViews - a.totalViews);
  }, [data]);

  const knowStats = useMemo(() => {
    if (!data) return { byType: {} as Record<string, number>, byDay: [] as { day: string; count: number }[] };
    const byType: Record<string, number> = {};
    const byDayMap: Record<string, number> = {};

    data.fluencyViews.forEach(v => {
      byType[v.entity_type] = (byType[v.entity_type] || 0) + 1;
      const day = v.created_at?.split("T")[0];
      if (day) byDayMap[day] = (byDayMap[day] || 0) + 1;
    });

    const days = Object.entries(byDayMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([day, count]) => ({ day, count }));

    return { byType, byDay: days };
  }, [data]);

  const knowMaxDay = Math.max(...knowStats.byDay.map(d => d.count), 1);

  const TABS = [
    { id: "activities" as const, label: "Activity Completion" },
    { id: "users" as const, label: "User Activity" },
    { id: "know" as const, label: "AI Updates" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-.04em", color: "#221D23" }}>
          Analytics
        </h1>
        <p style={{ margin: "4px 0 0", color: "#6B6B6B", fontSize: 14 }}>
          Engagement metrics for your company
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#6B6B6B" }}>From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #E8E6DC", fontSize: 13, fontFamily: "inherit", fontWeight: 600 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#6B6B6B" }}>To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #E8E6DC", fontSize: 13, fontFamily: "inherit", fontWeight: 600 }} />
        </div>
        {data && data.categories.length > 0 && (
          <select value={cat} onChange={e => setCat(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #E8E6DC", fontSize: 13, fontWeight: 700, background: "white", cursor: "pointer", fontFamily: "inherit" }}>
            <option value="">All categories</option>
            {data.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#B0ABA5", fontSize: 14 }}>Loading analytics...</div>
      ) : !data ? (
        <div style={{ padding: 60, textAlign: "center", color: "#B0ABA5", fontSize: 14 }}>Failed to load data</div>
      ) : (
        <>
          {/* Summary stats */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <StatMini label="Total Views" value={totalViews} color="#221D23" />
            <StatMini label="Active Users" value={activeUserIds.size} color="#3696FC" />
            <StatMini label="Completions" value={completedCount} color="#17A855" />
            <StatMini label="In Progress" value={inProgressCount} color="#F68A29" />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "9px 18px", borderRadius: 999, border: "1.5px solid",
                borderColor: tab === t.id ? "#221D23" : "#E8E6DC",
                background: tab === t.id ? "#221D23" : "white",
                color: tab === t.id ? "white" : "#6B6B6B",
                fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Activity completion tab */}
          {tab === "activities" && (
            <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 20, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                  <thead>
                    <tr style={{ background: "#FAFAF8", borderBottom: "1px solid #E8E6DC" }}>
                      {["Activity", "Views", "Started", "Completed", "Completion Rate", "Avg Quiz"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activityStats.map((a, i) => (
                      <tr key={a.id} style={{ borderBottom: "1px solid #F0EEE8", background: i % 2 === 0 ? "white" : "#FAFAF8" }}>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#221D23", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700 }}>{a.views}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#1A7FD4" }}>{a.started}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#17A855" }}>{a.completed}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 60, height: 6, background: "#F0EEE8", borderRadius: 999, overflow: "hidden" }}>
                              <div style={{ height: "100%", background: a.completionRate > 60 ? "#23CE68" : a.completionRate > 30 ? "#FFCE00" : "#F68A29", width: `${a.completionRate}%`, borderRadius: 999 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#6B6B6B" }}>{a.completionRate}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#6B6B6B" }}>
                          {a.avgQuiz != null ? `${a.avgQuiz}%` : "—"}
                        </td>
                      </tr>
                    ))}
                    {activityStats.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#B0ABA5", fontSize: 13 }}>No activity data for this period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* User activity tab */}
          {tab === "users" && (
            <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 20, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                  <thead>
                    <tr style={{ background: "#FAFAF8", borderBottom: "1px solid #E8E6DC" }}>
                      {["User", "Total Views", "Active Days", "Completed", "In Progress", "Last Active"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: ".04em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.map((u, i) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid #F0EEE8", background: i % 2 === 0 ? "white" : "#FAFAF8" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: "50%", background: "#221D23",
                              color: "white", display: "grid", placeItems: "center",
                              fontSize: 10, fontWeight: 800, flexShrink: 0,
                            }}>
                              {(u.full_name ?? u.email ?? "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#221D23" }}>{u.full_name ?? "—"}</div>
                              <div style={{ fontSize: 11, color: "#B0ABA5" }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700 }}>{u.totalViews}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#3696FC" }}>{u.activeDays}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#17A855" }}>{u.completed}</td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#F68A29" }}>{u.inProgress}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#6B6B6B" }}>
                          {u.lastActive ? new Date(u.lastActive).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Never"}
                        </td>
                      </tr>
                    ))}
                    {userStats.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#B0ABA5", fontSize: 13 }}>No user data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Updates (Know) tab */}
          {tab === "know" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Views by content type */}
              <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 20, padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 20, color: "#221D23" }}>Views by Content Type</div>
                {Object.keys(knowStats.byType).length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center", color: "#B0ABA5", fontSize: 13 }}>No AI updates views</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                      { key: "module", label: "Modules", color: "#3696FC" },
                      { key: "video", label: "Videos", color: "#23CE68" },
                      { key: "tool", label: "Tools", color: "#FFCE00" },
                      { key: "deep_dive", label: "Deep Dives", color: "#F68A29" },
                      { key: "tool_guide", label: "Tool Guides", color: "#623CEB" },
                      { key: "page", label: "Page Views", color: "#B0ABA5" },
                    ].map(t => {
                      const count = knowStats.byType[t.key] || 0;
                      if (count === 0) return null;
                      const maxVal = Math.max(...Object.values(knowStats.byType), 1);
                      return (
                        <div key={t.key}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#221D23" }}>{t.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: t.color }}>{count}</span>
                          </div>
                          <div style={{ height: 10, background: "#F0EEE8", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", background: t.color, width: `${(count / maxVal) * 100}%`, borderRadius: 999, transition: "width .3s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Views over time */}
              <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 20, padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4, color: "#221D23" }}>AI Updates — Daily Views</div>
                <div style={{ fontSize: 12, color: "#B0ABA5", marginBottom: 20 }}>Last 14 days</div>
                {knowStats.byDay.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center", color: "#B0ABA5", fontSize: 13 }}>No data for this period</div>
                ) : (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 160 }}>
                    {knowStats.byDay.map(({ day, count }) => (
                      <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#6B6B6B" }}>{count}</span>
                        <div style={{
                          width: "100%",
                          height: `${Math.max((count / knowMaxDay) * 100, 3)}%`,
                          background: count > 0 ? "linear-gradient(180deg, #3696FC, #1A7FD4)" : "#F0EEE8",
                          borderRadius: 4,
                          minHeight: 3,
                        }} />
                        <span style={{ fontSize: 9, color: "#B0ABA5", fontWeight: 600, transform: "rotate(-45deg)", transformOrigin: "center", whiteSpace: "nowrap" }}>
                          {new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";
import { useMemo } from "react";

type Props = {
  companyUsers: any[];
  allProgress: any[];
  totalActivities: number;
  activityViews: any[];
  fluencyViews: any[];
};

function StatCard({ label, value, sub, bg, border }: { label: string; value: string | number; sub?: string; bg: string; border: string }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: "20px 22px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-.05em", color: "#221D23", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: "#B0ABA5", fontWeight: 600, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

export default function AdminDashboardClient({ companyUsers, allProgress, totalActivities, activityViews, fluencyViews }: Props) {
  const completedCount = allProgress.filter(p => p.status === "completed").length;
  const inProgressCount = allProgress.filter(p => p.status === "in_progress").length;
  const activeUserIds = new Set(allProgress.map(p => p.user_id));
  const activeUsers = activeUserIds.size;
  const avgCompletion = companyUsers.length
    ? Math.round((completedCount / (companyUsers.length * Math.max(totalActivities, 1))) * 100)
    : 0;

  const last7Days = useMemo(() => getLastNDays(7), []);

  const viewsByDay = useMemo(() => {
    const map: Record<string, number> = {};
    last7Days.forEach(d => (map[d] = 0));
    activityViews.forEach(v => {
      const day = v.created_at?.split("T")[0];
      if (day && map[day] !== undefined) map[day]++;
    });
    fluencyViews.forEach(v => {
      const day = v.created_at?.split("T")[0];
      if (day && map[day] !== undefined) map[day]++;
    });
    return last7Days.map(d => ({ day: d, count: map[d] }));
  }, [activityViews, fluencyViews, last7Days]);

  const maxViews = Math.max(...viewsByDay.map(d => d.count), 1);

  const topActivities = useMemo(() => {
    const acc: Record<string, { title: string; completed: number; started: number }> = {};
    allProgress.forEach((p: any) => {
      const key = p.activity_id;
      if (!acc[key]) acc[key] = { title: p.activities?.title ?? key, completed: 0, started: 0 };
      if (p.status === "completed") acc[key].completed++;
      else if (p.status === "in_progress") acc[key].started++;
    });
    return Object.entries(acc)
      .sort((a, b) => (b[1].completed + b[1].started) - (a[1].completed + a[1].started))
      .slice(0, 8);
  }, [allProgress]);

  const leaderboard = useMemo(() => {
    return companyUsers
      .map(u => {
        const userProgress = allProgress.filter(p => p.user_id === u.id);
        const completed = userProgress.filter(p => p.status === "completed").length;
        const inProg = userProgress.filter(p => p.status === "in_progress").length;
        return { ...u, completed, inProgress: inProg };
      })
      .filter(u => u.completed > 0 || u.inProgress > 0)
      .sort((a, b) => b.completed - a.completed || b.inProgress - a.inProgress)
      .slice(0, 5);
  }, [companyUsers, allProgress]);

  const maxCompleted = Math.max(...leaderboard.map(u => u.completed), 1);

  const fluencyByType = useMemo(() => {
    const counts: Record<string, number> = {};
    fluencyViews.forEach(v => {
      counts[v.entity_type] = (counts[v.entity_type] || 0) + 1;
    });
    return counts;
  }, [fluencyViews]);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-.04em", color: "#221D23" }}>
          Dashboard
        </h1>
        <p style={{ margin: "4px 0 0", color: "#6B6B6B", fontSize: 14 }}>
          Overview of your team's learning engagement
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
        <StatCard label="Total Users" value={companyUsers.length} bg="rgba(35,206,104,.06)" border="rgba(35,206,104,.15)" />
        <StatCard label="Active Learners" value={activeUsers} sub={`${companyUsers.length - activeUsers} haven't started`} bg="rgba(54,150,252,.06)" border="rgba(54,150,252,.15)" />
        <StatCard label="Completions" value={completedCount} sub={`${inProgressCount} in progress`} bg="rgba(255,206,0,.08)" border="rgba(255,206,0,.2)" />
        <StatCard label="Avg Completion" value={`${avgCompletion}%`} sub={`across ${totalActivities} activities`} bg="rgba(246,138,41,.06)" border="rgba(246,138,41,.15)" />
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Activity chart */}
        <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4, color: "#221D23" }}>Engagement — Last 7 Days</div>
          <div style={{ fontSize: 12, color: "#B0ABA5", marginBottom: 20 }}>Total views (activities + AI updates)</div>
          <div style={{ display: "flex", gap: 8 }}>
            {viewsByDay.map(({ day, count }) => {
              const BAR_AREA = 120;
              const barH = maxViews > 0 ? Math.max(Math.round((count / maxViews) * BAR_AREA), 4) : 4;
              return (
                <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6B" }}>{count}</span>
                  <div style={{ width: "100%", height: BAR_AREA, display: "flex", alignItems: "flex-end" }}>
                    <div style={{
                      width: "100%",
                      height: barH,
                      background: count > 0 ? "linear-gradient(180deg, #FFCE00, #F68A29)" : "#F0EEE8",
                      borderRadius: 6,
                      transition: "height .3s ease",
                    }} />
                  </div>
                  <span style={{ fontSize: 10, color: "#B0ABA5", fontWeight: 600 }}>
                    {new Date(day).toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Updates engagement */}
        <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4, color: "#221D23" }}>AI Updates Engagement</div>
          <div style={{ fontSize: 12, color: "#B0ABA5", marginBottom: 20 }}>Views by content type</div>
          {Object.keys(fluencyByType).length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "#B0ABA5", fontSize: 13 }}>No AI updates views yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "module", label: "Modules", color: "#3696FC" },
                { key: "video", label: "Videos", color: "#23CE68" },
                { key: "tool", label: "Tools", color: "#FFCE00" },
                { key: "deep_dive", label: "Deep Dives", color: "#F68A29" },
                { key: "tool_guide", label: "Tool Guides", color: "#623CEB" },
              ].filter(t => fluencyByType[t.key]).map(t => {
                const count = fluencyByType[t.key] || 0;
                const maxFluency = Math.max(...Object.values(fluencyByType), 1);
                return (
                  <div key={t.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#221D23" }}>{t.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#6B6B6B" }}>{count}</span>
                    </div>
                    <div style={{ height: 8, background: "#F0EEE8", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: t.color, width: `${(count / maxFluency) * 100}%`, borderRadius: 999, transition: "width .3s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Two-column: top activities + leaderboard */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Top activities */}
        <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, color: "#221D23" }}>Top Activities</div>
          {topActivities.length === 0 ? (
            <p style={{ color: "#B0ABA5", fontSize: 13, textAlign: "center", padding: 24 }}>No activity data yet</p>
          ) : (
            topActivities.map(([id, { title, completed, started }]) => (
              <div key={id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F0EEE8" }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#221D23", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "rgba(35,206,104,.1)", color: "#17A855" }}>
                    {completed} done
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Leaderboard */}
        <div style={{ background: "white", border: "1px solid #E8E6DC", borderRadius: 20, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#221D23" }}>Leaderboard</div>
              <div style={{ fontSize: 12, color: "#B0ABA5", marginTop: 2 }}>By activities completed</div>
            </div>
            <a href="/admin/users" style={{ fontSize: 12, fontWeight: 700, color: "#3696FC", textDecoration: "none" }}>View all</a>
          </div>
          {leaderboard.length === 0 ? (
            <p style={{ color: "#B0ABA5", fontSize: 13, textAlign: "center", padding: 24 }}>No completions yet</p>
          ) : (
            leaderboard.map((u, i) => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #F0EEE8" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: i === 0 ? "linear-gradient(135deg, #FFCE00, #F68A29)" : i === 1 ? "#E8E6DC" : i === 2 ? "rgba(246,138,41,.2)" : "#F0EEE8",
                  color: i === 0 ? "#221D23" : "#6B6B6B",
                  display: "grid", placeItems: "center",
                  fontSize: 11, fontWeight: 800,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#221D23", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>
                    {u.full_name ?? u.email}
                  </div>
                  <div style={{ height: 4, background: "#F0EEE8", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${(u.completed / maxCompleted) * 100}%`,
                      background: i === 0 ? "linear-gradient(90deg, #FFCE00, #F68A29)" : "#3696FC",
                      borderRadius: 999,
                    }} />
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#221D23" }}>{u.completed}</div>
                  <div style={{ fontSize: 10, color: "#B0ABA5", fontWeight: 600 }}>
                    completed{u.inProgress > 0 ? ` · ${u.inProgress} active` : ""}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

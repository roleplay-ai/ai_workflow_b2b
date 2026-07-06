"use client";
import { useState } from "react";
import Link from "next/link";
import { formatTopPercentile } from "@/lib/points";
import B2BTopbar from "@/components/B2BTopbar";
import "@/app/card-styles.css";
import type { HistoryRow, CategoryProficiency, Certificate, RecommendedActivity } from "./page";

// ── Stat card ─────────────────────────────────────────────────────────────

function StatCard({ label, value, delta, deltaColor, dark = false }: { label: string; value: string; delta?: string; deltaColor?: string; dark?: boolean }) {
  const resolvedDeltaColor = deltaColor ?? (dark ? "rgba(255,255,255,.55)" : "#23CE68");
  return (
    <div style={{ background: dark ? "#1C1820" : "#fff", border: `1px solid ${dark ? "#2E2930" : "#E9E4DC"}`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: dark ? "rgba(255,255,255,.45)" : "#746F78", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: dark ? 32 : 28, fontWeight: 900, letterSpacing: "-.04em", color: dark ? "#FFCE00" : "#1C1820", lineHeight: 1 }}>
        {value}
      </div>
      {delta && <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 5, color: resolvedDeltaColor }}>{delta}</div>}
    </div>
  );
}

// ── Tab switch ────────────────────────────────────────────────────────────

type ProfileTab = "history" | "progress";

function TabSwitch({ active, onChange }: { active: ProfileTab; onChange: (tab: ProfileTab) => void }) {
  return (
    <div className="workflows-main-tab-switch" role="tablist" aria-label="Profile views">
      <button
        type="button"
        role="tab"
        aria-selected={active === "history"}
        className={`workflows-main-tab${active === "history" ? " active" : ""}`}
        onClick={() => onChange("history")}
      >
        <span className="workflows-main-tab-icon" aria-hidden="true">▦</span>
        History
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "progress"}
        className={`workflows-main-tab${active === "progress" ? " active" : ""}`}
        onClick={() => onChange("progress")}
      >
        <span className="workflows-main-tab-icon" aria-hidden="true">✦</span>
        Progress
      </button>
    </div>
  );
}

// ── Formatting helpers ────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

const BAR_COLORS = ["#FFCE00", "#3696FC", "#23CE68", "#623CEA"];

// ── Section header ────────────────────────────────────────────────────────

function SectionHeader({ label, title, desc }: { label: string; title: string; desc: string }) {
  return (
    <div className="rail-header">
      <div className="rail-title">
        <span className="section-label">{label}</span>
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
    </div>
  );
}

// ── History tab ───────────────────────────────────────────────────────────

function HistorySection({ history }: { history: HistoryRow[] }) {
  return (
    <section className="rail">
      <SectionHeader label="Completed by you" title="Workflow History" desc="Workflows you finished, points earned, and optional bonus quiz results." />

      {history.length === 0 ? (
        <div className="static-grid-empty">No completed workflows yet. Finish a workflow to see it here.</div>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid #E9E4DC", borderRadius: 14, background: "#fff" }}>
          <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Workflow", "Category", "Base Pts", "Quiz", "Bonus", "Date Completed"].map(h => (
                  <th key={h} style={{ textAlign: "left", color: "#817988", background: "var(--bg)", padding: "12px 18px", fontSize: 11, letterSpacing: ".08em", fontWeight: 800, textTransform: "uppercase", borderBottom: "1px solid #E9E4DC" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td style={{ padding: "16px 18px", borderBottom: "1px solid #F0EBE4", fontSize: 14.5, fontWeight: 800, color: "#1C1820" }}>{h.title}</td>
                  <td style={{ padding: "16px 18px", borderBottom: "1px solid #F0EBE4" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "5px 10px", background: "rgba(98,60,234,.08)", color: "#623CEA", fontSize: 12.5, fontWeight: 800, whiteSpace: "nowrap" }}>
                      {h.category}
                    </span>
                  </td>
                  <td style={{ padding: "16px 18px", borderBottom: "1px solid #F0EBE4", color: "#0FA84D", fontWeight: 900, whiteSpace: "nowrap" }}>+{h.points}</td>
                  <td style={{ padding: "16px 18px", borderBottom: "1px solid #F0EBE4", whiteSpace: "nowrap" }}>
                    {h.quizScore == null ? (
                      <span style={{ color: "#9A9590", fontWeight: 700, fontSize: 13 }}>Not taken</span>
                    ) : (
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 12.5,
                        fontWeight: 800,
                        background: h.quizScore >= 70 ? "rgba(35,206,104,.1)" : h.quizScore > 0 ? "rgba(246,138,41,.1)" : "rgba(154,149,144,.12)",
                        color: h.quizScore >= 70 ? "#128A45" : h.quizScore > 0 ? "#B05000" : "#746F78",
                      }}>
                        {h.quizScore}%
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "16px 18px", borderBottom: "1px solid #F0EBE4", whiteSpace: "nowrap" }}>
                    {h.bonusPoints > 0 ? (
                      <span style={{ color: "#623CEA", fontWeight: 900 }}>+{h.bonusPoints}</span>
                    ) : (
                      <span style={{ color: "#9A9590", fontWeight: 700, fontSize: 13 }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "16px 18px", borderBottom: "1px solid #F0EBE4", color: "#746F78", fontWeight: 700, whiteSpace: "nowrap" }}>{formatDate(h.completedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── Progress tab ──────────────────────────────────────────────────────────

function ProficiencyPanel({ proficiency }: { proficiency: CategoryProficiency[] }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E9E4DC", borderRadius: 16, padding: 22 }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 19, fontWeight: 900, letterSpacing: "-.02em", color: "#1C1820" }}>AI Proficiency by Category</h3>
      {proficiency.length === 0 ? (
        <div style={{ color: "#746F78", fontSize: 13.5, fontWeight: 600 }}>Complete workflows to build your proficiency profile.</div>
      ) : (
        proficiency.map((p, i) => (
          <div key={p.category} style={{ display: "grid", gridTemplateColumns: "150px 1fr 48px", gap: 14, alignItems: "center", margin: "14px 0", color: "#746F78", fontWeight: 800, fontSize: 13.5 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.category}</span>
            <div style={{ height: 11, borderRadius: 999, background: "#EEE8DC", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: "inherit", width: `${p.percent}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
            </div>
            <strong style={{ color: "#1C1820", textAlign: "right" }}>{p.percent}%</strong>
          </div>
        ))
      )}
    </div>
  );
}

function RankPanel({ companyPercentile, companySize, userTotalPoints, companyAvgPoints }: { companyPercentile: number | null; companySize: number; userTotalPoints: number; companyAvgPoints: number }) {
  const topPercentileLabel = formatTopPercentile(companyPercentile, companySize);
  const delta = userTotalPoints - companyAvgPoints;
  const deltaLabel = companySize > 0 ? (delta >= 0 ? `${delta} pts above avg` : `${Math.abs(delta)} pts below avg`) : "—";

  return (
    <div style={{ background: "#1C1820", color: "#fff", borderRadius: 18, padding: 24 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "rgba(255,255,255,.45)" }}>Company Benchmark</div>
      <div style={{ color: "#FFCE00", fontSize: 38, fontWeight: 900, letterSpacing: "-.03em", margin: "8px 0 12px" }}>{topPercentileLabel}</div>
      {[
        ["Your points", String(userTotalPoints)],
        ["Company avg points", String(companyAvgPoints)],
        ["Vs. company avg", deltaLabel],
      ].map(([label, value]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: "1px solid #332C3A", color: "#C8C1D0", fontWeight: 700, fontSize: 13.5 }}>
          <span>{label}</span>
          <strong style={{ color: "#fff", whiteSpace: "nowrap" }}>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function CertificatesSection({ certificates }: { certificates: Certificate[] }) {
  return (
    <section className="rail">
      <SectionHeader label="Achievements" title="Certificates" desc="Milestones earned as you complete more workflows." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
        {certificates.map(c => (
          <div key={c.title} style={{ border: "1px solid #E9E4DC", borderRadius: 14, padding: 18, background: "#fff" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", background: "#FFF6CF", marginBottom: 14, fontSize: 20 }}>{c.icon}</div>
            <strong style={{ display: "block", fontSize: 15.5, color: "#1C1820" }}>{c.title}</strong>
            <span style={{ display: "block", color: "#746F78", fontSize: 12.5, fontWeight: 700, marginTop: 6 }}>
              {c.earnedAt ? `Earned on ${formatDate(c.earnedAt)}` : `${c.percent}% complete`}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecommendedSection({ recommended }: { recommended: RecommendedActivity[] }) {
  if (recommended.length === 0) return null;
  return (
    <section className="rail">
      <SectionHeader label="Recommended next" title="What You Can Learn Next" desc="Suggested based on your completed workflows and current skill gaps." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {recommended.map(r => (
          <Link key={r.id} href={`/activity/${r.id}`} style={{ display: "block", border: "1px solid #E9E4DC", borderRadius: 16, padding: 20, background: "#fff", textDecoration: "none" }}>
            <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "4px 10px", background: "rgba(98,60,234,.08)", color: "#623CEA", fontSize: 11.5, fontWeight: 800, marginBottom: 14 }}>
              {r.category}
            </span>
            <strong style={{ display: "block", fontSize: 16.5, color: "#1C1820", marginBottom: 8 }}>{r.title}</strong>
            {r.description && <p style={{ margin: 0, color: "#746F78", fontWeight: 600, fontSize: 13.5, lineHeight: 1.45 }}>{r.description}</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Main client component ────────────────────────────────────────────────

type Props = {
  history: HistoryRow[];
  userTotalPoints: number;
  completedCount: number;
  inProgressCount: number;
  thisWeekCount: number;
  bestCategory: { name: string; points: number } | null;
  companyPercentile: number | null;
  companySize: number;
  companyAvgPoints: number;
  streakCount: number;
  aiLevel: { label: string; next: string | null };
  proficiency: CategoryProficiency[];
  certificates: Certificate[];
  recommended: RecommendedActivity[];
};

export default function ProfileClient({ history, userTotalPoints, completedCount, inProgressCount, thisWeekCount, bestCategory, companyPercentile, companySize, companyAvgPoints, streakCount, aiLevel, proficiency, certificates, recommended }: Props) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("history");
  const topPercentileLabel = formatTopPercentile(companyPercentile, companySize);
  const percentileDelta = companySize > 0 ? `Company avg: ${companyAvgPoints} pts` : "Points rank within your company";

  return (
    <>
      <B2BTopbar />

      <div style={{ flex: 1, background: "var(--bg)" }}>
        <div style={{ padding: "22px 28px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-.03em", color: "#1C1820", lineHeight: 1.1 }}>
                {activeTab === "history" ? "History" : "Progress"}
              </h1>
              <p style={{ fontSize: 13.5, color: "#746F78", fontWeight: 600, marginTop: 4 }}>
                {activeTab === "history"
                  ? "Completed workflows, points earned, category, and completion date."
                  : "Your AI proficiency, achievements, and company benchmark."}
              </p>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", borderRadius: 999, padding: "5px 12px", background: "rgba(98,60,234,.08)", color: "#623CEA", border: "1px solid rgba(98,60,234,.18)", whiteSpace: "nowrap" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#623CEA", display: "inline-block" }} />
              {activeTab === "history" ? `${completedCount} completed workflows` : "Updated this week"}
            </span>
          </div>

          {activeTab === "history" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12, paddingBottom: 18, borderBottom: "1px solid #E9E4DC" }}>
              <StatCard label="💰 Total Points" value={String(userTotalPoints)} delta="Earned from completed workflows" />
              <StatCard label="✅ Completed" value={String(completedCount)} delta={`${inProgressCount} in progress`} deltaColor={inProgressCount > 0 ? "#F68A29" : undefined} />
              <StatCard label="🔥 This Week" value={String(thisWeekCount)} delta="Workflows completed" deltaColor="#F68A29" />
              <StatCard label="⭐ Best Category" value={bestCategory?.name ?? "—"} delta={bestCategory ? `${bestCategory.points} points earned` : "Complete a workflow to start"} deltaColor="#623CEA" />
              <StatCard label="Company Rank" value={topPercentileLabel} delta={percentileDelta} dark />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12, paddingBottom: 18, borderBottom: "1px solid #E9E4DC" }}>
              <StatCard label="💰 My Points" value={String(userTotalPoints)} delta={companySize > 0 ? `${Math.max(userTotalPoints - companyAvgPoints, 0)} pts above company avg` : "Earned from completed workflows"} />
              <StatCard label="✅ Completed" value={String(completedCount)} delta={`${inProgressCount} in progress`} deltaColor={inProgressCount > 0 ? "#F68A29" : undefined} />
              <StatCard label="🧠 AI Level" value={aiLevel.label} delta={aiLevel.next ? `Next: ${aiLevel.next}` : "Highest level reached"} deltaColor="#623CEA" />
              <StatCard label="🔥 Weekly Streak" value={String(streakCount)} delta={streakCount > 0 ? "Active this week" : "Complete a workflow to start"} deltaColor="#F68A29" />
              <StatCard label="Company Rank" value={topPercentileLabel} delta={percentileDelta} dark />
            </div>
          )}
        </div>

        <div className="ndb-root workflows-main-tab-bar" style={{ padding: "18px 28px 0" }}>
          <TabSwitch active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="ndb-root" style={{ padding: "18px 28px 40px", display: "flex", flexDirection: "column", gap: 8 }}>
          {activeTab === "history" ? (
            <HistorySection history={history} />
          ) : (
            <>
              <section className="rail">
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)", gap: 18 }}>
                  <ProficiencyPanel proficiency={proficiency} />
                  <RankPanel companyPercentile={companyPercentile} companySize={companySize} userTotalPoints={userTotalPoints} companyAvgPoints={companyAvgPoints} />
                </div>
              </section>
              <CertificatesSection certificates={certificates} />
              <RecommendedSection recommended={recommended} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

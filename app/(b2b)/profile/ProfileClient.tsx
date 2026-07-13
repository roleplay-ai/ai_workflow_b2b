"use client";
import { useState } from "react";
import Link from "next/link";
import { formatTopPercentile, type LeaderboardStats, type LeaderboardEntry } from "@/lib/points";
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

// ── History ───────────────────────────────────────────────────────────────

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

function leaderboardInitials(name: string | null): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";
}

function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid #332C3A" }}>
      <span style={{ width: 20, textAlign: "center", fontWeight: 900, fontSize: 13, color: isMe ? "#FFCE00" : "rgba(255,255,255,.45)" }}>
        {entry.rank}
      </span>
      <span style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", background: isMe ? "#FFCE00" : "#332C3A", color: isMe ? "#1C1820" : "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
        {leaderboardInitials(entry.full_name)}
      </span>
      <span style={{ flex: 1, fontWeight: 800, fontSize: 13.5, color: isMe ? "#FFCE00" : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {isMe ? "You" : (entry.full_name || "Teammate")}
      </span>
      <span style={{ fontWeight: 900, fontSize: 13.5, color: isMe ? "#FFCE00" : "#C8C1D0", whiteSpace: "nowrap" }}>
        {entry.points} pts
      </span>
    </div>
  );
}

function LeaderboardModal({
  leaderboard,
  onClose,
}: {
  leaderboard: LeaderboardStats;
  onClose: () => void;
}) {
  const meId = leaderboard.me?.user_id;
  const entries = leaderboard.all.length > 0 ? leaderboard.all : leaderboard.top;

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="leaderboard-modal-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(28, 24, 32, 0.55)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <style>{`
        .leaderboard-modal-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,.3) transparent;
        }
        .leaderboard-modal-scroll::-webkit-scrollbar {
          width: 2px;
        }
        .leaderboard-modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .leaderboard-modal-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,.3);
          border-radius: 999px;
        }
        .leaderboard-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,.5);
        }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 640,
          maxHeight: "min(80vh, 640px)",
          display: "flex",
          flexDirection: "column",
          background: "#1C1820",
          color: "#fff",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,.1)",
          boxShadow: "0 24px 64px rgba(0,0,0,.45)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "20px 22px 14px", borderBottom: "1px solid #332C3A" }}>
          <div>
            <div id="leaderboard-modal-title" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "rgba(255,255,255,.45)" }}>
              Company Leaderboard
            </div>
            <div style={{ color: "#FFCE00", fontSize: 18, fontWeight: 900, letterSpacing: "-.02em", marginTop: 6 }}>
              All {leaderboard.company_size} teammates
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close leaderboard"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "rgba(255,255,255,.08)",
              color: "rgba(255,255,255,.7)",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              fontFamily: "inherit",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="leaderboard-modal-scroll" style={{ overflowY: "auto", padding: "4px 22px 18px" }}>
          {entries.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,.5)", fontSize: 13, fontWeight: 600, padding: "16px 0" }}>
              No teammates have earned points yet.
            </div>
          ) : (
            entries.map(entry => (
              <LeaderboardRow key={entry.user_id} entry={entry} isMe={entry.user_id === meId} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function LeaderboardPanel({ leaderboard }: { leaderboard: LeaderboardStats }) {
  const [open, setOpen] = useState(false);
  const meId = leaderboard.me?.user_id;
  const topEntries = leaderboard.top.slice(0, 5);
  const showViewMore = leaderboard.company_size > 5 || leaderboard.all.length > 5;

  return (
    <>
      <div style={{ background: "#1C1820", color: "#fff", borderRadius: 18, padding: 24 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "rgba(255,255,255,.45)" }}>Company Leaderboard</div>
        <div style={{ color: "#FFCE00", fontSize: 19, fontWeight: 900, letterSpacing: "-.02em", margin: "8px 0 4px" }}>
          Top 5{leaderboard.company_size > 0 ? ` of ${leaderboard.company_size} teammates` : ""}
        </div>

        {topEntries.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,.5)", fontSize: 13, fontWeight: 600, padding: "16px 0" }}>
            No teammates have earned points yet.
          </div>
        ) : (
          <div style={{ marginTop: 8 }}>
            {topEntries.map(entry => (
              <LeaderboardRow key={entry.user_id} entry={entry} isMe={entry.user_id === meId} />
            ))}
          </div>
        )}

        {showViewMore && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{
              marginTop: 14,
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,206,0,.28)",
              background: "rgba(255,206,0,.1)",
              color: "#FFCE00",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            View more
          </button>
        )}
      </div>

      {open && <LeaderboardModal leaderboard={leaderboard} onClose={() => setOpen(false)} />}
    </>
  );
}

function CertificatesSection({ certificates }: { certificates: Certificate[] }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E9E4DC", borderRadius: 16, padding: 22 }}>
      <div style={{ marginBottom: 16 }}>
        {/* <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "#746F78", marginBottom: 4 }}>
          Achievements
        </div> */}
        <h3 style={{ margin: 0, fontSize: 19, fontWeight: 900, letterSpacing: "-.02em", color: "#1C1820" }}>Certificates</h3>
        {/* <p style={{ margin: "6px 0 0", color: "#746F78", fontSize: 13, fontWeight: 600, lineHeight: 1.45 }}>
          Milestones earned as you complete more workflows.
        </p> */}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {certificates.map(c => (
          <div key={c.title} style={{ border: "1px solid #E9E4DC", borderRadius: 14, padding: 16, background: "#FFFDF8" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center", background: "#FFF6CF", marginBottom: 12, fontSize: 18 }}>{c.icon}</div>
            <strong style={{ display: "block", fontSize: 14.5, color: "#1C1820" }}>{c.title}</strong>
            <span style={{ display: "block", color: "#746F78", fontSize: 12, fontWeight: 700, marginTop: 6 }}>
              {c.earnedAt ? `Earned on ${formatDate(c.earnedAt)}` : `${c.percent}% complete`}
            </span>
          </div>
        ))}
      </div>
    </div>
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
  companyPercentile: number | null;
  companySize: number;
  companyAvgPoints: number;
  streakCount: number;
  aiLevel: { label: string; next: string | null };
  proficiency: CategoryProficiency[];
  certificates: Certificate[];
  recommended: RecommendedActivity[];
  leaderboard: LeaderboardStats;
};

export default function ProfileClient({ history, userTotalPoints, completedCount, companyPercentile, companySize, companyAvgPoints, streakCount, aiLevel, proficiency, certificates, recommended, leaderboard }: Props) {
  const topPercentileLabel = formatTopPercentile(companyPercentile, companySize);
  const percentileDelta = companySize > 0 ? `Company avg: ${companyAvgPoints} pts` : "Points rank within your company";
  const rankLabel = leaderboard.me ? `Among ${leaderboard.company_size} teammates` : "Unranked";
  const rankValue = leaderboard.me ? String(leaderboard.me.rank) : "—";

  return (
    <>
      <B2BTopbar points={userTotalPoints} />

      <div style={{ flex: 1, background: "var(--bg)" }}>
        <div style={{ padding: "22px 28px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-.03em", color: "#1C1820", lineHeight: 1.1 }}>
                My Progress
              </h1>
              <p style={{ fontSize: 13.5, color: "#746F78", fontWeight: 600, marginTop: 4 }}>
                Your AI proficiency, achievements, and company benchmark.
              </p>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", borderRadius: 999, padding: "5px 12px", background: "rgba(98,60,234,.08)", color: "#623CEA", border: "1px solid rgba(98,60,234,.18)", whiteSpace: "nowrap" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#623CEA", display: "inline-block" }} />
              {completedCount} completed workflows
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12, paddingBottom: 18, borderBottom: "1px solid #E9E4DC" }}>
            <StatCard label="💰 My Points" value={String(userTotalPoints)} delta={companySize > 0 ? `${Math.max(userTotalPoints - companyAvgPoints, 0)} pts above company avg` : "Earned from completed workflows"} />
            <StatCard label="🎖️ Rank" value={rankValue} delta={rankLabel} deltaColor="#623CEA" />
            <StatCard label="🧠 AI Level" value={aiLevel.label} delta={aiLevel.next ? `Next: ${aiLevel.next}` : "Highest level reached"} deltaColor="#623CEA" />
            <StatCard label="🔥 Weekly Streak" value={String(streakCount)} delta={streakCount > 0 ? "Active this week" : "Complete a workflow to start"} deltaColor="#F68A29" />
            <StatCard label="Company Rank" value={topPercentileLabel} delta={percentileDelta} dark />
          </div>
        </div>

        <div className="ndb-root" style={{ padding: "18px 28px 40px", display: "flex", flexDirection: "column", gap: 8 }}>
          <section className="rail">
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(260px, 0.7fr)", gap: 18, alignItems: "start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
                <ProficiencyPanel proficiency={proficiency} />
                <CertificatesSection certificates={certificates} />
              </div>
              <LeaderboardPanel leaderboard={leaderboard} />
            </div>
          </section>
          <RecommendedSection recommended={recommended} />
          <HistorySection history={history} />
        </div>
      </div>
    </>
  );
}

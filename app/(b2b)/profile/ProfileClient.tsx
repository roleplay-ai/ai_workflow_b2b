"use client";
import { useState } from "react";
import Link from "next/link";
import { formatTopPercentile, type LeaderboardStats, type LeaderboardEntry } from "@/lib/points";
import B2BTopbar from "@/components/B2BTopbar";
import "@/app/card-styles.css";
import "./profile.css";
import type { HistoryRow, CategoryProficiency, Certificate, RecommendedActivity } from "./page";

// ── Formatting helpers ────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Metric card ───────────────────────────────────────────────────────────

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="myp-metric-card">
      <div className="myp-metric-label">{label}</div>
      <div className="myp-metric-value">{value}</div>
      {sub ? <div className="myp-metric-sub">{sub}</div> : null}
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────────

function HistorySection({ history }: { history: HistoryRow[] }) {
  return (
    <section className="myp-panel">
      <h2>Workflow History</h2>
      {history.length === 0 ? (
        <div className="myp-panel-empty">No completed workflows yet. Finish a workflow to see it here.</div>
      ) : (
        <div className="myp-table-wrap">
          <table className="myp-table">
            <thead>
              <tr>
                {["Workflow", "Category", "Base Pts", "Quiz", "Bonus", "Date Completed"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 650 }}>{h.title}</td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "5px 10px", background: "#f3f3f3", color: "#3a3a3a", fontSize: 12.5, fontWeight: 650, whiteSpace: "nowrap" }}>
                      {h.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, whiteSpace: "nowrap" }}>+{h.points}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {h.quizScore == null ? (
                      <span style={{ color: "#9b9b9b", fontWeight: 600, fontSize: 13 }}>Not taken</span>
                    ) : (
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 12.5,
                        fontWeight: 650,
                        background: "#f3f3f3",
                        color: "#0d0d0d",
                      }}>
                        {h.quizScore}%
                      </span>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {h.bonusPoints > 0 ? (
                      <span style={{ fontWeight: 700 }}>+{h.bonusPoints}</span>
                    ) : (
                      <span style={{ color: "#9b9b9b", fontWeight: 600, fontSize: 13 }}>—</span>
                    )}
                  </td>
                  <td style={{ color: "#6b6b6b", fontWeight: 600, whiteSpace: "nowrap" }}>{formatDate(h.completedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── Proficiency ───────────────────────────────────────────────────────────

function ProficiencyPanel({ proficiency }: { proficiency: CategoryProficiency[] }) {
  return (
    <div className="myp-panel">
      <h3>AI Proficiency by Category</h3>
      {proficiency.length === 0 ? (
        <div className="myp-panel-empty">Complete workflows to build your proficiency profile.</div>
      ) : (
        proficiency.map((p) => (
          <div key={p.category} className="myp-skill-row">
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.category}</span>
            <div className="myp-skill-bar">
              <div className="myp-skill-fill" style={{ width: `${p.percent}%` }} />
            </div>
            <strong style={{ textAlign: "right" }}>{p.percent}%</strong>
          </div>
        ))
      )}
    </div>
  );
}

// ── Leaderboard ───────────────────────────────────────────────────────────

function leaderboardInitials(name: string | null): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";
}

function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  return (
    <div className="myp-leader-row">
      <span className={`myp-leader-rank ${isMe ? "is-me" : ""}`}>{entry.rank}</span>
      <span className={`myp-leader-avatar ${isMe ? "is-me" : ""}`}>{leaderboardInitials(entry.full_name)}</span>
      <span className={`myp-leader-name ${isMe ? "is-me" : ""}`}>{isMe ? "You" : (entry.full_name || "Teammate")}</span>
      <span className="myp-leader-points">{entry.points} pts</span>
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
          scrollbar-color: rgba(34,29,35,.2) transparent;
        }
        .leaderboard-modal-scroll::-webkit-scrollbar {
          width: 2px;
        }
        .leaderboard-modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .leaderboard-modal-scroll::-webkit-scrollbar-thumb {
          background: rgba(34,29,35,.2);
          border-radius: 999px;
        }
        .leaderboard-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(34,29,35,.35);
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
          background: "#fff",
          color: "#0d0d0d",
          borderRadius: 18,
          border: "1px solid #e5e5e5",
          boxShadow: "0 24px 64px rgba(0,0,0,.25)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "20px 22px 14px", borderBottom: "1px solid #e5e5e5" }}>
          <div>
            <div id="leaderboard-modal-title" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: "#6b6b6b" }}>
              Company Leaderboard
            </div>
            <div style={{ color: "#0d0d0d", fontSize: 18, fontWeight: 700, letterSpacing: "-.02em", marginTop: 6 }}>
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
              background: "#f3f3f3",
              color: "#6b6b6b",
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
            <div style={{ color: "#6b6b6b", fontSize: 13, fontWeight: 600, padding: "16px 0" }}>
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
      <div className="myp-panel">
        <h3 style={{ marginBottom: 4 }}>Company Leaderboard</h3>
        <div style={{ color: "#6b6b6b", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
          Top 5{leaderboard.company_size > 0 ? ` of ${leaderboard.company_size} teammates` : ""}
        </div>

        {topEntries.length === 0 ? (
          <div className="myp-panel-empty">No teammates have earned points yet.</div>
        ) : (
          <div>
            {topEntries.map(entry => (
              <LeaderboardRow key={entry.user_id} entry={entry} isMe={entry.user_id === meId} />
            ))}
          </div>
        )}

        {showViewMore && (
          <button type="button" className="myp-view-more" onClick={() => setOpen(true)}>
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
    <div className="myp-panel">
      <h3>Certificates</h3>
      <div className="myp-cert-grid">
        {certificates.map(c => (
          <div key={c.title} className="myp-cert-card">
            <div className="myp-cert-icon">{c.icon}</div>
            <strong className="myp-cert-title">{c.title}</strong>
            <span className="myp-cert-sub">
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
    <section className="myp-panel">
      <h2>What You Can Learn Next</h2>
      <div className="myp-rec-grid">
        {recommended.map(r => (
          <Link key={r.id} href={`/activity/${r.id}`} className="myp-rec-card">
            <span className="myp-rec-tag">{r.category}</span>
            <strong className="myp-rec-title">{r.title}</strong>
            {r.description && <p className="myp-rec-desc">{r.description}</p>}
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
        <div className="myp-page-header">
          <div className="myp-page-header-row">
            <div>
              <h1>My Progress</h1>
              <p>Your AI proficiency, achievements, and company benchmark.</p>
            </div>
            <span className="myp-page-pill">
              {completedCount} completed workflows
            </span>
          </div>

          <div className="myp-metric-grid">
            <MetricCard label="My Points" value={String(userTotalPoints)} sub={companySize > 0 ? `${Math.max(userTotalPoints - companyAvgPoints, 0)} pts above company avg` : "Earned from completed workflows"} />
            <MetricCard label="Rank" value={rankValue} sub={rankLabel} />
            <MetricCard label="AI Level" value={aiLevel.label} sub={aiLevel.next ? `Next: ${aiLevel.next}` : "Highest level reached"} />
            <MetricCard label="Weekly Streak" value={String(streakCount)} sub={streakCount > 0 ? "Active this week" : "Complete a workflow to start"} />
            <MetricCard label="Company Rank" value={topPercentileLabel} sub={percentileDelta} />
          </div>
        </div>

        <div className="myp-main">
          <div className="myp-layout">
            <div className="myp-layout-col">
              <ProficiencyPanel proficiency={proficiency} />
              <CertificatesSection certificates={certificates} />
            </div>
            <LeaderboardPanel leaderboard={leaderboard} />
          </div>

          <RecommendedSection recommended={recommended} />
          <HistorySection history={history} />
        </div>
      </div>
    </>
  );
}

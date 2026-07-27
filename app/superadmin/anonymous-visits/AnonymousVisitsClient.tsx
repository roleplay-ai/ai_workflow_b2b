"use client";

import Link from "next/link";

type VisitRow = {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  path: string | null;
  created_at: string;
};

type Props = {
  visits: VisitRow[];
  totalCount: number;
  last24hCount: number;
  last7dCount: number;
  migrationMissing: boolean;
};

const statCard: React.CSSProperties = {
  padding: "14px 16px", background: "#FAFAF8", borderRadius: 12, border: "1px solid #F0EEE8",
};

export default function AnonymousVisitsClient({ visits, totalCount, last24hCount, last7dCount, migrationMissing }: Props) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/superadmin" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 10, fontSize: 13, fontWeight: 600, color: "#746F78", textDecoration: "none" }}>
          ← Back to Activities
        </Link>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-.04em" }}>Anonymous Visits</h1>
        <p style={{ margin: "3px 0 0", color: "#746F78", fontSize: 13 }}>
          Footfall from visitors browsing without an account — one entry per new anonymous session, with IP for a rough sense of where traffic comes from.
        </p>
      </div>

      {migrationMissing ? (
        <div style={{ padding: "16px 18px", borderRadius: 12, border: "1px solid #F0DFA0", background: "#FFFBE9", color: "#6B5A12", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
          The anonymous_visits table hasn&rsquo;t been created yet — apply the 20260727_anonymous_visits.sql migration to start collecting footfall data.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          <div style={statCard}>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-.05em", color: "#221D23" }}>{totalCount.toLocaleString()}</div>
            <div style={{ fontSize: 11.5, color: "#9B9490", fontWeight: 600, marginTop: 2 }}>All-time visits</div>
          </div>
          <div style={statCard}>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-.05em", color: "#221D23" }}>{last24hCount.toLocaleString()}</div>
            <div style={{ fontSize: 11.5, color: "#9B9490", fontWeight: 600, marginTop: 2 }}>Last 24 hours</div>
          </div>
          <div style={statCard}>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-.05em", color: "#221D23" }}>{last7dCount.toLocaleString()}</div>
            <div style={{ fontSize: 11.5, color: "#9B9490", fontWeight: 600, marginTop: 2 }}>Last 7 days</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visits.map((v) => (
          <div key={v.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", background: "white", border: "1.5px solid #E8E6DC", borderRadius: 12, padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "#221D23" }}>{v.ip_address ?? "unknown IP"}</span>
              <span style={{ fontSize: 12, color: "#A09AA6" }}>{v.path ?? "/"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <span style={{ fontSize: 11.5, color: "#A09AA6", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={v.user_agent ?? undefined}>
                {v.user_agent ?? ""}
              </span>
              <span style={{ fontSize: 12, color: "#746F78", fontWeight: 600, whiteSpace: "nowrap" }}>
                {new Date(v.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}

        {!migrationMissing && visits.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#A09AA6" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👣</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>No anonymous visits yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>When someone browses the app without logging in, their first visit shows up here.</div>
          </div>
        )}
      </div>
    </div>
  );
}

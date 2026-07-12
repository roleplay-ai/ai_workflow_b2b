"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type RequestRow = {
  id: string;
  question: string;
  context: string | null;
  reply_to_email: string;
  status: "open" | "resolved";
  created_at: string;
  resolved_at: string | null;
  user_id: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

type Props = {
  requests: RequestRow[];
};

export default function SupportRequestsClient({ requests: initRequests }: Props) {
  const supabase = createClient();
  const [requests, setRequests] = useState<RequestRow[]>(initRequests);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markResolved(id: string) {
    setResolvingId(id);
    const resolved_at = new Date().toISOString();
    const { error } = await supabase
      .from("support_requests")
      .update({ status: "resolved", resolved_at, resolved_by: currentUserId })
      .eq("id", id);

    if (!error) {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "resolved", resolved_at } : r)),
      );
    }
    setResolvingId(null);
  }

  const openCount = requests.filter((r) => r.status === "open").length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/superadmin" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 10, fontSize: 13, fontWeight: 600, color: "#746F78", textDecoration: "none" }}>
          ← Back to Activities
        </Link>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-.04em" }}>Support Requests</h1>
        <p style={{ margin: "3px 0 0", color: "#746F78", fontSize: 13 }}>
          Questions users sent to your team from Ask AI&rsquo;s &ldquo;Ask our team&rdquo; dialog —
          {" "}{openCount} open, the last {requests.length} requests, most recent first.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {requests.map((r) => (
          <div key={r.id} style={{ background: "white", border: "1.5px solid #E8E6DC", borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 12px rgba(34,29,35,.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, color: "#A09AA6", fontWeight: 600 }}>
                {r.profiles?.full_name ?? r.profiles?.email ?? "Unknown user"} · {new Date(r.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </div>
              <span style={{
                fontSize: 10.5, fontWeight: 800, padding: "3px 10px", borderRadius: 999,
                textTransform: "uppercase", letterSpacing: ".04em",
                background: r.status === "resolved" ? "#EDFBF3" : "#FFF8E1",
                color: r.status === "resolved" ? "#065F46" : "#92650A",
              }}>
                {r.status === "resolved" ? "Resolved" : "Open"}
              </span>
            </div>

            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#221D23", marginBottom: r.context ? 6 : 8 }}>
              {r.question}
            </div>
            {r.context && (
              <div style={{ fontSize: 13, color: "#57525A", lineHeight: 1.55, whiteSpace: "pre-wrap", marginBottom: 8 }}>
                {r.context}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12.5, color: "#746F78" }}>
                Reply to <a href={`mailto:${r.reply_to_email}`} style={{ color: "#623CEA", textDecoration: "underline" }}>{r.reply_to_email}</a>
              </div>
              {r.status === "open" && (
                <button
                  onClick={() => void markResolved(r.id)}
                  disabled={resolvingId === r.id}
                  style={{
                    padding: "7px 14px", borderRadius: 999, border: "1.5px solid #E8E6DC",
                    background: "white", color: "#221D23", fontWeight: 700, cursor: resolvingId === r.id ? "default" : "pointer",
                    fontFamily: "inherit", fontSize: 12.5, opacity: resolvingId === r.id ? 0.5 : 1,
                  }}
                >
                  {resolvingId === r.id ? "Marking…" : "Mark resolved"}
                </button>
              )}
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#A09AA6" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>No requests yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>When users send Ask AI a question it couldn&rsquo;t answer, it&rsquo;ll show up here.</div>
          </div>
        )}
      </div>
    </div>
  );
}

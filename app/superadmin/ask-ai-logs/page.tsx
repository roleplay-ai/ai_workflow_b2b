import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 300; // most recent raw messages scanned to build the Q&A list below

type MessageRow = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  cited_chunks: string[];
  created_at: string;
  user_id: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

type QARow = {
  id: string;
  question: string;
  answer: string | null;
  askedBy: string;
  askedAt: string;
  fromKnowledgeBase: boolean;
};

export default async function AskAILogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profileError || !profile) redirect("/login");
  if (profile.role !== "superadmin") redirect("/apply");

  const { data: rows } = await supabase
    .from("kb_chat_messages")
    .select("id, session_id, role, content, cited_chunks, created_at, user_id, profiles(full_name, email)")
    .order("created_at", { ascending: true })
    .limit(HISTORY_LIMIT);

  const messages = (rows ?? []) as unknown as MessageRow[];

  // Pair each user question with the assistant reply that immediately follows it in
  // the same session — messages arrive strictly alternating (user, then assistant) per
  // turn, so the next message with a matching session_id is always that turn's answer.
  const qaRows: QARow[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const next = messages[i + 1];
    const answer = next && next.role === "assistant" && next.session_id === m.session_id ? next : null;
    qaRows.push({
      id: m.id,
      question: m.content,
      answer: answer?.content ?? null,
      askedBy: m.profiles?.full_name ?? m.profiles?.email ?? "Unknown user",
      askedAt: m.created_at,
      fromKnowledgeBase: (answer?.cited_chunks?.length ?? 0) > 0,
    });
  }
  qaRows.reverse(); // most recent first

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/superadmin" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 10, fontSize: 13, fontWeight: 600, color: "#746F78", textDecoration: "none" }}>
          ← Back to Activities
        </Link>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: "-.04em" }}>Ask AI — Search Queries</h1>
        <p style={{ margin: "3px 0 0", color: "#746F78", fontSize: 13 }}>
          What users are actually asking Ask AI, and whether the knowledge base could answer it —
          the last {HISTORY_LIMIT} messages, most recent first.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {qaRows.map((row) => (
          <div key={row.id} style={{ background: "white", border: "1.5px solid #E8E6DC", borderRadius: 14, padding: "14px 16px", boxShadow: "0 2px 12px rgba(34,29,35,.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, color: "#A09AA6", fontWeight: 600 }}>
                {row.askedBy} · {new Date(row.askedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </div>
              <span style={{
                fontSize: 10.5, fontWeight: 800, padding: "3px 10px", borderRadius: 999,
                textTransform: "uppercase", letterSpacing: ".04em",
                background: row.fromKnowledgeBase ? "#EDFBF3" : "#FFF8E1",
                color: row.fromKnowledgeBase ? "#065F46" : "#92650A",
              }}>
                {row.fromKnowledgeBase ? "From knowledge base" : "General knowledge"}
              </span>
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#221D23", marginBottom: row.answer ? 6 : 0 }}>
              {row.question}
            </div>
            {row.answer && (
              <div style={{ fontSize: 13, color: "#57525A", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                {row.answer.length > 400 ? `${row.answer.slice(0, 400)}…` : row.answer}
              </div>
            )}
          </div>
        ))}

        {qaRows.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#A09AA6" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>No questions asked yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Once users start using Ask AI, their questions will show up here.</div>
          </div>
        )}
      </div>
    </div>
  );
}

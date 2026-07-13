"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ASK_LIMITS } from "@/lib/ask/guardrails";

type Props = {
  open: boolean;
  question: string;
  sessionId: string;
  onClose: () => void;
};

/** Modal for sending an unanswered question to a human — the real fulfillment of
 *  Ask AI's "would you like to email us this question?" fallback sentence. Reply-to
 *  is always the requester's account email (set server-side), never a form field —
 *  staff see it in the superadmin support inbox. */
export default function AskTeamDialog({ open, question, sessionId, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [questionDraft, setQuestionDraft] = useState(question);
  const [context, setContext] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      setQuestionDraft(question);
      setContext("");
      setSubmitted(false);
      setError(null);
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled && data.user?.email) setAccountEmail(data.user.email);
    });
    return () => { cancelled = true; };
  }, [open]);

  async function handleSend() {
    if (!questionDraft.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/ask/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionDraft.trim(), context: context.trim() || undefined, sessionId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't send that — try again in a moment.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Couldn't send that — try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", margin: 0,
        width: "min(520px, calc(100% - 32px))", maxHeight: "calc(100vh - 48px)", overflowY: "auto",
        color: "#221D23", background: "white",
        border: "1px solid #E8E6DC", borderRadius: 16, padding: 0,
      }}
    >
      <div style={{ padding: 22 }}>
        {!submitted ? (
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: "0 0 5px", fontSize: 18, fontWeight: 900, letterSpacing: "-.02em" }}>Ask our team</h2>
                <p style={{ margin: 0, color: "#746F78", fontSize: 13, lineHeight: 1.5 }}>
                  Send us the question Ask AI couldn&rsquo;t answer. A person from our team will follow up by email.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                style={{ border: "none", background: "transparent", color: "#746F78", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <label style={{ display: "block" }}>
                <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 700 }}>Your question</div>
                <textarea
                  value={questionDraft}
                  onChange={(e) => setQuestionDraft(e.target.value)}
                  rows={3}
                  maxLength={ASK_LIMITS.maxQuestionChars}
                  style={textareaStyle}
                />
              </label>
              <label style={{ display: "block" }}>
                <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 700 }}>
                  Add more detail <span style={{ color: "#A09AA6", fontWeight: 600 }}>(optional)</span>
                </div>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={2}
                  maxLength={ASK_LIMITS.maxSupportContextChars}
                  placeholder="What answer were you expecting, or what is still unclear?"
                  style={textareaStyle}
                />
              </label>

              {error && <div style={{ fontSize: 13, color: "#C1121F", fontWeight: 600 }}>{error}</div>}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
                <button type="button" onClick={onClose} style={secondaryBtnStyle}>Cancel</button>
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={submitting || !questionDraft.trim()}
                  style={{ ...primaryBtnStyle, opacity: submitting || !questionDraft.trim() ? 0.5 : 1 }}
                >
                  {submitting ? "Sending…" : "Send to team"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "16px 0 4px" }}>
            <div style={{
              width: 42, height: 42, margin: "0 auto 12px", borderRadius: 12,
              background: "#FFCE00", color: "#221D23", display: "grid", placeItems: "center", fontSize: 20, fontWeight: 900,
            }}>
              ✓
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 900 }}>Request sent</h2>
            <p style={{ margin: "0 0 16px", color: "#746F78", fontSize: 13 }}>
              We&rsquo;ll respond{accountEmail ? ` to ${accountEmail}` : ""} within 24 hours.
            </p>
            <button type="button" onClick={onClose} style={primaryBtnStyle}>Done</button>
          </div>
        )}
      </div>
    </dialog>
  );
}

const textareaStyle: React.CSSProperties = {
  width: "100%", resize: "vertical", boxSizing: "border-box", padding: "8px 10px",
  border: "1.5px solid #E8E6DC", borderRadius: 10, fontSize: 14, fontFamily: "inherit", color: "#221D23",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "9px 16px", borderRadius: 10, border: "none", background: "#221D23", color: "white",
  fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: "9px 16px", borderRadius: 10, border: "1.5px solid #E8E6DC", background: "white", color: "#221D23",
  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
};

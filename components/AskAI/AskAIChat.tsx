"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import OnboardingFlow, { type ChipsState, type OnboardingExistingAnswers } from "./OnboardingFlow";

/** Renders an assistant answer's markdown (bold, bullets, etc.) with the app's chat typography. */
function MarkdownAnswer({ content }: { content: string }) {
  return (
    <div style={{ fontSize: 15, lineHeight: 1.65, color: "#221D23" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p style={{ margin: "0 0 10px" }}>{children}</p>,
          ul: ({ children }) => <ul style={{ margin: "4px 0 10px", paddingLeft: 20 }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: "4px 0 10px", paddingLeft: 20 }}>{children}</ol>,
          li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
          strong: ({ children }) => <strong style={{ fontWeight: 800 }}>{children}</strong>,
          h1: ({ children }) => <div style={{ fontSize: 17, fontWeight: 800, margin: "6px 0 8px" }}>{children}</div>,
          h2: ({ children }) => <div style={{ fontSize: 16, fontWeight: 800, margin: "6px 0 8px" }}>{children}</div>,
          h3: ({ children }) => <div style={{ fontSize: 15, fontWeight: 800, margin: "6px 0 6px" }}>{children}</div>,
          code: ({ children }) => (
            <code style={{ background: "#F0EEE8", padding: "1px 6px", borderRadius: 4, fontSize: "0.9em", fontFamily: "ui-monospace, monospace" }}>
              {children}
            </code>
          ),
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noreferrer" style={{ color: "#623CEA", textDecoration: "underline" }}>
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

type Citation = {
  documentTitle: string;
  pageNumber: number;
  excerpt: string;
  images: { imageUrl: string; width: number | null; height: number | null }[];
};

type SuggestedWorkflow = { id: string; title: string };

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  suggestedWorkflows?: SuggestedWorkflow[];
};

const SUGGESTIONS = [
  "Can I read PDF attachments in Gmail with this tool?",
  "What can this workflow automate for me?",
  "Which AI tool handles this best?",
];

type Props = {
  needsOnboarding?: boolean;
  functionOptions?: string[];
  categoryOptions?: string[];
  existingAnswers?: OnboardingExistingAnswers | null;
};

/** Full-page, ChatGPT/Claude-style "Ask AI" assistant. Grounded entirely in the superadmin-managed knowledge base. */
export default function AskAIChat({
  needsOnboarding = false,
  functionOptions = [],
  categoryOptions = [],
  existingAnswers = null,
}: Props) {
  const searchParams = useSearchParams();
  const forceOnboarding = searchParams.get("onboarding") === "update";
  const effectiveNeedsOnboarding = needsOnboarding || forceOnboarding;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [openInfoKey, setOpenInfoKey] = useState<string | null>(null);
  const [onboardingChips, setOnboardingChips] = useState<ChipsState | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_COMPOSER_HEIGHT = 200;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_HEIGHT)}px`;
  }, [input]);

  useEffect(() => {
    const prefill = searchParams.get("q");
    if (prefill) setInput(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function newChat() {
    setMessages([]);
    setInput("");
    setSessionId(crypto.randomUUID());
  }

  async function sendMessage(text?: string) {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, sessionId }),
      });
      const body = await res.json();

      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: body.error ?? "Something went wrong." }]);
      } else {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: body.answer,
          citations: body.citations ?? [],
          suggestedWorkflows: body.suggestedWorkflows ?? [],
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Couldn't reach the assistant — try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  }

  const composer = (autoFocus: boolean) => (
    <div style={{
      display: "flex", alignItems: "flex-end", gap: 10,
      width: "100%", padding: "12px 14px", borderRadius: 20,
      background: "white", border: "1.5px solid #E8E6DC",
      boxShadow: "0 8px 28px rgba(34,29,35,.07)",
    }}>
      <textarea
        ref={textareaRef}
        autoFocus={autoFocus}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
        placeholder="Ask about a workflow…"
        rows={1}
        style={{
          flex: 1, resize: "none", border: "none", outline: "none",
          fontSize: 15, fontFamily: "inherit", lineHeight: 1.5,
          maxHeight: MAX_COMPOSER_HEIGHT, overflowY: "auto",
          background: "transparent", color: "#221D23",
        }}
      />
      <button
        onClick={() => void sendMessage()}
        disabled={loading || !input.trim()}
        aria-label="Send"
        style={{
          width: 38, height: 38, borderRadius: "50%", border: "none",
          background: "#221D23", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: loading || !input.trim() ? "default" : "pointer",
          opacity: loading || !input.trim() ? 0.35 : 1, flexShrink: 0,
          transition: "opacity .12s",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>
    </div>
  );

  const onboardingComposer = () => (
    <div>
      {onboardingChips && (
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          marginBottom: 10,
        }}>
          {onboardingChips.options.map((opt) => {
            const isSelected = onboardingChips.selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => onboardingChips.onPick(opt)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: `1.5px solid ${isSelected ? "#221D23" : "#E8E6DC"}`,
                  background: isSelected ? "#FFCE00" : "white",
                  color: "#221D23",
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 10px 24px rgba(34,29,35,.10)",
                }}
              >
                {onboardingChips.multi && (isSelected ? "✓ " : "+ ")}
                {opt}
              </button>
            );
          })}
          {onboardingChips.onContinue && (
            <button
              onClick={onboardingChips.onContinue}
              disabled={onboardingChips.continueDisabled}
              style={{
                ...(onboardingChips.continueStyle ?? {
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "1.5px solid #E8B800",
                  background: "#FFCE00",
                  color: "#221D23",
                  fontSize: 12.5,
                  fontWeight: 900,
                  cursor: onboardingChips.continueDisabled ? "default" : "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 10px 24px rgba(34,29,35,.12)",
                  marginLeft: 4,
                }),
                cursor: onboardingChips.continueDisabled ? "default" : "pointer",
                opacity: onboardingChips.continueDisabled ? 0.45 : 1,
              }}
            >
              {onboardingChips.continueLabel ?? "Continue →"}
            </button>
          )}
        </div>
      )}

      <div style={{ opacity: 0.8, pointerEvents: "none", userSelect: "none" }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 10,
          width: "100%", padding: "12px 14px", borderRadius: 20,
          background: "white", border: "1.5px solid #E8E6DC",
          boxShadow: "0 8px 28px rgba(34,29,35,.07)",
        }}>
          <textarea
            value=""
            placeholder="Ask about a workflow…"
            rows={1}
            disabled
            style={{
              flex: 1, resize: "none", border: "none", outline: "none",
              fontSize: 15, fontFamily: "inherit", lineHeight: 1.5,
              maxHeight: MAX_COMPOSER_HEIGHT, overflowY: "auto",
              background: "transparent", color: "#221D23",
            }}
          />
          <button
            disabled
            aria-label="Send"
            style={{
              width: 38, height: 38, borderRadius: "50%", border: "none",
              background: "#221D23", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "default",
              opacity: 0.35, flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  if (effectiveNeedsOnboarding) {
    return (
      <div style={{ height: "calc(100vh - var(--topbar-h))", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center",
          padding: "9px 24px", borderBottom: "1px solid #EEEAE4", flexShrink: 0,
        }}>
          <div style={{ fontSize: 13.5, fontWeight: 900, color: "#221D23", letterSpacing: "-.02em" }}>Ask AI</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <OnboardingFlow
            functionOptions={functionOptions}
            categoryOptions={categoryOptions}
            existingAnswers={existingAnswers}
            uiMode="composer-chips"
            onChipsChange={setOnboardingChips}
          />
        </div>

        {/* Disabled composer, blurred, with floating chips for options */}
        <div style={{ position: "relative", zIndex: 20, background: "var(--bg)", padding: "16px 24px 22px", flexShrink: 0 }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>{onboardingComposer()}</div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div style={{
        height: "calc(100vh - var(--topbar-h))", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "24px", overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, marginBottom: 18,
            background: "linear-gradient(135deg, #FFCE00 0%, #FFA800 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, boxShadow: "0 8px 24px rgba(255,206,0,.35)",
          }}>
            ✦
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: "-.03em", color: "#221D23" }}>
            Ask AI
          </h1>
          <p style={{ margin: "8px 0 28px", fontSize: 14, color: "#746F78", textAlign: "center", maxWidth: 440, lineHeight: 1.5 }}>
            Ask whether you can build a specific workflow, or anything else covered in the knowledge base.
            Every answer is grounded in what&apos;s actually uploaded — no guessing.
          </p>

          <div style={{ width: "100%" }}>{composer(true)}</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => void sendMessage(s)}
                style={{
                  padding: "8px 14px", borderRadius: 999, border: "1.5px solid #E8E6DC",
                  background: "white", color: "#57525A", fontSize: 12.5, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "calc(100vh - var(--topbar-h))", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "9px 24px", borderBottom: "1px solid #EEEAE4", flexShrink: 0,
      }}>
        <div style={{ fontSize: 13.5, fontWeight: 900, color: "#221D23", letterSpacing: "-.02em" }}>Ask AI</div>
        <button
          onClick={newChat}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "5px 11px", borderRadius: 999, border: "1.5px solid #E8E6DC",
            background: "white", color: "#221D23", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New chat
        </button>
      </div>

      {/* Messages */}
      <div ref={listRef} style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 24px 12px", display: "flex", flexDirection: "column", gap: 20 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
              {m.role === "user" ? (
                <div style={{
                  maxWidth: "80%", padding: "10px 16px", borderRadius: 18,
                  background: "#221D23", color: "white",
                  fontSize: 15, lineHeight: 1.65, whiteSpace: "pre-wrap",
                }}>
                  {m.content}
                </div>
              ) : (
                <div style={{ maxWidth: "100%", width: "100%" }}>
                  <MarkdownAnswer content={m.content} />
                </div>
              )}

              {m.citations && m.citations.some((c) => c.images.length > 0) && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10, width: "100%" }}>
                  {m.citations.filter((c) => c.images.length > 0).map((c, ci) => {
                    const key = `${i}-${ci}`;
                    return (
                      <div key={ci} style={{ position: "relative", display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
                        {c.images.map((img, ii) => (
                          <a key={ii} href={img.imageUrl} target="_blank" rel="noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.imageUrl} alt="" style={{ height: 130, borderRadius: 10, border: "1px solid #E8E6DC", display: "block" }} />
                          </a>
                        ))}
                        <button
                          onClick={() => setOpenInfoKey((prev) => (prev === key ? null : key))}
                          aria-label="Source"
                          style={{
                            position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: "50%",
                            background: "rgba(34,29,35,.65)", color: "white", border: "none", fontSize: 12, fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, lineHeight: 1,
                          }}
                        >i</button>
                        {openInfoKey === key && (
                          <div style={{
                            position: "absolute", top: 30, right: 6, zIndex: 10,
                            background: "#221D23", color: "white", fontSize: 11.5, padding: "6px 10px", borderRadius: 8,
                            whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,0,0,.25)",
                          }}>
                            {c.documentTitle} · p. {c.pageNumber}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {m.suggestedWorkflows && m.suggestedWorkflows.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8, width: "100%" }}>
                  {m.suggestedWorkflows.map((w) => (
                    <a
                      key={w.id}
                      href={`/activity/${w.id}`}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 14px", borderRadius: 999,
                        border: "1.5px solid #FFCE00", background: "#FFFBEB",
                        color: "#221D23", fontSize: 13, fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      ✦ {w.title}
                      <span aria-hidden="true">→</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ fontSize: 13, color: "#A09AA6", fontStyle: "italic" }}>Thinking…</div>
          )}
        </div>
      </div>

      {/* Composer — sits above the message list (which shrinks to make room as it grows).
          Background matches the page (var(--bg)), not white, so it blends in rather than
          reading as a separate white panel; it still needs to be opaque so it visually
          covers scrolled messages behind it. */}
      <div style={{ position: "relative", zIndex: 20, background: "var(--bg)", padding: "16px 24px 22px", flexShrink: 0 }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>{composer(false)}</div>
      </div>
    </div>
  );
}

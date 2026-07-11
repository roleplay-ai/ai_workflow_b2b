"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import OnboardingFlow, { type ChipsState, type OnboardingExistingAnswers } from "./OnboardingFlow";
import SuggestedWorkflowCard from "./SuggestedWorkflowCard";
import { ASK_LIMITS } from "@/lib/ask/guardrails";
import "@/app/card-styles.css";

/** Renders an assistant answer's markdown (bold, bullets, etc.) with the app's chat typography. */
function MarkdownAnswer({ content }: { content: string }) {
  return (
    <div style={{ fontSize: 15, lineHeight: 1.65, color: "#221D23" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p style={{ margin: "0 0 10px" }}>{children}</p>,
          ul: ({ children }) => (
            <ul style={{ margin: "4px 0 10px", paddingLeft: 22, listStyleType: "disc", listStylePosition: "outside" }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: "4px 0 10px", paddingLeft: 22, listStyleType: "decimal", listStylePosition: "outside" }}>
              {children}
            </ol>
          ),
          li: ({ children }) => <li style={{ marginBottom: 4, display: "list-item" }}>{children}</li>,
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

type SuggestedWorkflow = {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  suggestedWorkflows?: SuggestedWorkflow[];
};

const SUGGESTION_CHIPS = [
  {
    text: "Which AI workflow should I try for my role?",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
  {
    text: "Can ChatGPT, Claude, Gemini, or Copilot do this?",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l1.9 5.8H20l-4.8 3.5 1.8 5.7L12 14.8 7 17.9l1.8-5.7L4 8.8h6.1z" />
      </svg>
    ),
  },
  {
    text: "How can I automate this task with AI?",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    text: "What should I learn next?",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  },
  {
    text: "Recommend a workflow for this task",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
      </svg>
    ),
  },
] as const;

const SUGGESTION_CHIP_ROWS = [SUGGESTION_CHIPS.slice(0, 2), SUGGESTION_CHIPS.slice(2)] as const;

const COACH_HELP_ITEMS = [
  {
    title: "Workflows",
    description: "Discover and build step-by-step AI workflows for real tasks.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="6" cy="6" r="2" />
        <circle cx="18" cy="6" r="2" />
        <circle cx="12" cy="18" r="2" />
        <path d="M8 6h8M7.2 7.6 10.8 16.4M16.8 7.6 13.2 16.4" />
      </svg>
    ),
  },
  {
    title: "Tool Comparison",
    description: "Compare top AI assistants to find the right tool for the job.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v18" />
        <path d="M5 7h14" />
        <path d="M5 7l-3 6h6L5 7zM19 7l-3 6h6l-3-6z" />
      </svg>
    ),
  },
  {
    title: "Apply AI to Work",
    description: "Get practical guidance to apply AI and drive real outcomes.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
] as const;

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

  const composerTextareaStyle: React.CSSProperties = {
    flex: 1, resize: "none", border: "none", outline: "none",
    fontSize: 15, fontFamily: "inherit", lineHeight: 1.5,
    maxHeight: MAX_COMPOSER_HEIGHT, overflowY: "auto",
    background: "transparent", color: "#221D23",
    padding: "8px 0 8px 8px", minHeight: 38, boxSizing: "border-box",
  };

  const composer = (autoFocus: boolean, landing = false) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
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
        placeholder={landing ? "Ask how to apply AI to your work…" : "Ask about a workflow…"}
        rows={1}
        maxLength={ASK_LIMITS.maxQuestionChars}
        style={composerTextareaStyle}
      />
      <button
        onClick={() => void sendMessage()}
        disabled={loading || !input.trim()}
        aria-label="Send"
        style={{
          width: 38, height: 38, borderRadius: "50%", border: "none",
          background: landing ? "#FFCE00" : "#221D23",
          color: landing ? "#221D23" : "white",
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
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: "12px 14px", borderRadius: 20,
          background: "white", border: "1.5px solid #E8E6DC",
          boxShadow: "0 8px 28px rgba(34,29,35,.07)",
        }}>
          <textarea
            value=""
            placeholder="Ask about a workflow…"
            rows={1}
            disabled
            style={composerTextareaStyle}
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
        padding: "32px 24px 48px", overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: 960, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, marginBottom: 18,
            background: "linear-gradient(135deg, #FFCE00 0%, #FFA800 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, boxShadow: "0 8px 24px rgba(255,206,0,.35)",
          }}>
            ✦
          </div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, letterSpacing: "-.04em", color: "#221D23", textAlign: "center" }}>
            Ask Nudgeable AI Coach
          </h1>
          <p style={{ margin: "10px 0 28px", fontSize: 15, color: "#746F78", textAlign: "center", maxWidth: 520, lineHeight: 1.55 }}>
            Get practical help applying AI to your work. Ask about workflows, tool capabilities, and what to use next.
          </p>

          <div style={{ width: "100%", maxWidth: 640 }}>{composer(true, true)}</div>

          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            marginTop: 16, width: "100%",
          }}>
            {SUGGESTION_CHIP_ROWS.map((row, rowIndex) => (
              <div
                key={rowIndex}
                style={{ display: "flex", flexWrap: "nowrap", gap: 10, justifyContent: "center" }}
              >
                {row.map((chip) => (
                  <button
                    key={chip.text}
                    onClick={() => void sendMessage(chip.text)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "9px 14px", borderRadius: 999, border: "1.5px solid #E8E6DC",
                      background: "white", color: "#221D23", fontSize: 13, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                      whiteSpace: "nowrap", flexShrink: 0,
                      boxShadow: "0 2px 8px rgba(34,29,35,.04)",
                    }}
                  >
                    <span style={{ color: "#FFCE00", display: "flex", flexShrink: 0 }}>{chip.icon}</span>
                    {chip.text}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div style={{
            width: "100%", maxWidth: 760, marginTop: 40,
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{ flex: 1, height: 1, background: "#E8E6DC" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#A09AA6", whiteSpace: "nowrap" }}>
              What this coach helps with
            </span>
            <div style={{ flex: 1, height: 1, background: "#E8E6DC" }} />
          </div>

          <div style={{
            width: "100%", maxWidth: 760, marginTop: 20,
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14,
          }}>
            {COACH_HELP_ITEMS.map((item) => (
              <div
                key={item.title}
                style={{
                  padding: "18px 16px", borderRadius: 16,
                  border: "1.5px solid #E8E6DC", background: "white",
                  boxShadow: "0 2px 10px rgba(34,29,35,.04)",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "#FFCE00", color: "#221D23",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 12,
                }}>
                  {item.icon}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#221D23", marginBottom: 6, letterSpacing: "-.02em" }}>
                  {item.title}
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: "#746F78" }}>
                  {item.description}
                </p>
              </div>
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
                <div style={{ marginTop: 14, width: "100%" }}>
                  <div style={{
                    fontSize: 11, fontWeight: 800, letterSpacing: ".08em",
                    textTransform: "uppercase", color: "#A09AA6", marginBottom: 8,
                  }}>
                    Recommended workflows
                  </div>
                  <div className="ndb-root" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    {m.suggestedWorkflows.map((w) => (
                      <SuggestedWorkflowCard
                        key={w.id}
                        id={w.id}
                        title={w.title}
                        description={w.description}
                        thumbnailUrl={w.thumbnailUrl}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="askai-thinking">
              <svg className="askai-thinking-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2c.6 3.4 1.4 5.6 2.6 6.9 1.3 1.3 3.5 2.1 6.9 2.6-3.4.6-5.6 1.4-6.9 2.6-1.3 1.3-2.1 3.5-2.6 6.9-.6-3.4-1.4-5.6-2.6-6.9C8.1 12.8 5.9 12 2.5 11.4c3.4-.5 5.6-1.3 6.9-2.6C10.6 7.6 11.4 5.4 12 2z" />
              </svg>
              <span className="askai-thinking-text">Thinking</span>
            </div>
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

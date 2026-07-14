"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import OnboardingFlow, { type ChipsState, type OnboardingExistingAnswers } from "./OnboardingFlow";
import SuggestedWorkflowCard from "./SuggestedWorkflowCard";
import AnswerSections from "./AnswerSections";
import AskTeamDialog from "./AskTeamDialog";
import AskAIThinking from "./AskAIThinking";
import SlideZoom from "@/components/SlideZoom";
import { ASK_LIMITS } from "@/lib/ask/guardrails";
import "@/app/card-styles.css";

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
    text: "Can ChatGPT edit local files?",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    ),
  },
  {
    text: "Will Gemini send emails for me?",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-10 7L2 7" />
      </svg>
    ),
  },
  {
    text: "Does Copilot offer Cowork features?",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    text: "Build a website with Claude?",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
] as const;

const JOURNEY_STEPS = [
  { title: "Ask about a task", description: "Explain what you need." },
  { title: "Get a clear answer", description: "See the short answer first." },
  { title: "Try a workflow", description: "Put the idea into practice." },
] as const;

function feedbackBtnStyle(active: boolean): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "6px 12px", borderRadius: 999,
    border: `1.5px solid ${active ? "#221D23" : "#E8E6DC"}`,
    background: active ? "#221D23" : "white",
    color: active ? "white" : "#221D23",
    fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  };
}

const askTeamBtnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "6px 12px", borderRadius: 999,
  border: "1.5px solid #FFCE00",
  background: "#FFCE00",
  color: "#221D23",
  fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
  marginLeft: "auto",
};

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
  const [zoomOpenKey, setZoomOpenKey] = useState<string | null>(null);
  const [onboardingChips, setOnboardingChips] = useState<ChipsState | null>(null);
  const [teamDialogFor, setTeamDialogFor] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<number, "up" | "down">>({});
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
    <div>
      {landing && (
        <label htmlFor="question-input" style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 700, color: "#221D23" }}>
          Tell us what you&rsquo;re working on
        </label>
      )}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "12px 14px", borderRadius: 20,
        background: "white", border: "1.5px solid #E8E6DC",
        boxShadow: "0 8px 28px rgba(34,29,35,.07)",
      }}>
        <textarea
          id={landing ? "question-input" : undefined}
          ref={textareaRef}
          autoFocus={autoFocus}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
          placeholder={landing ? "For example: I want to [task] using [tool] so that [desired result]" : "Ask about a workflow…"}
          rows={landing ? 2 : 1}
          maxLength={ASK_LIMITS.maxQuestionChars}
          style={composerTextareaStyle}
        />
        <button
          onClick={() => void sendMessage()}
          disabled={loading || !input.trim()}
          aria-label="Send"
          style={landing ? {
            display: "flex", alignItems: "center", gap: 6,
            padding: "0 16px", height: 38, borderRadius: 12, border: "none",
            background: "#FFCE00", color: "#221D23", fontSize: 14, fontWeight: 800, fontFamily: "inherit",
            cursor: loading || !input.trim() ? "default" : "pointer",
            opacity: loading || !input.trim() ? 0.35 : 1, flexShrink: 0,
            transition: "opacity .12s", whiteSpace: "nowrap",
          } : {
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
          {landing && "Ask AI"}
        </button>
      </div>
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
          <video
            src="/ask-ai/star-logo.mp4"
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
            style={{
              width: 72,
              height: 72,
              marginBottom: 18,
              objectFit: "contain",
              display: "block",
            }}
          />
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, letterSpacing: "-.04em", color: "#221D23", textAlign: "center" }}>
            What do you want to do with AI?
          </h1>
          <p style={{ margin: "10px 0 28px", fontSize: 15, color: "#746F78", textAlign: "center", maxWidth: 570, lineHeight: 1.55 }}>
            Describe a task, problem, or idea. We&rsquo;ll suggest an approach, show useful supporting information, and recommend a ready-to-use workflow.
          </p>

          <div style={{ width: "100%", maxWidth: 640 }}>
            {composer(true, true)}
            {/* <p style={{ margin: "10px 2px 0", fontSize: 12.5, color: "#A09AA6", lineHeight: 1.5 }}>
              <strong style={{ color: "#746F78" }}>I want to</strong> [task] <strong style={{ color: "#746F78" }}>using</strong> [tool or information] <strong style={{ color: "#746F78" }}>so that</strong> [desired result]
            </p> */}
          </div>

          <div style={{ width: "100%", maxWidth: 640, marginTop: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#221D23", marginBottom: 10 }}>Or start with an example</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {SUGGESTION_CHIPS.map((chip) => (
                <button
                  key={chip.text}
                  onClick={() => void sendMessage(chip.text)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "9px 14px", borderRadius: 12, border: "1.5px solid #E8E6DC",
                    background: "white", color: "#221D23", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                    boxShadow: "0 2px 8px rgba(34,29,35,.04)",
                  }}
                >
                  <span style={{ color: "#FFCE00", display: "flex", flexShrink: 0 }}>{chip.icon}</span>
                  {chip.text}
                </button>
              ))}
            </div>
          </div>
          {/* 
          <div style={{
            width: "100%", maxWidth: 760, marginTop: 40, paddingTop: 24, borderTop: "1px solid #E8E6DC",
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18,
          }}>
            {JOURNEY_STEPS.map((step, i) => (
              <div key={step.title} style={{ display: "grid", gridTemplateColumns: "26px minmax(0,1fr)", gap: 8, textAlign: "left" }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "#221D23", color: "#FFCE00",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12.5, fontWeight: 800,
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#221D23" }}>{step.title}</div>
                  <div style={{ fontSize: 12.5, color: "#746F78", marginTop: 2 }}>{step.description}</div>
                </div>
              </div>
            ))}
          </div> */}
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
                  <AnswerSections content={m.content} />
                </div>
              )}

              {m.citations && m.citations.some((c) => c.images.length > 0) && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 10, width: "100%" }}>
                  {m.citations.filter((c) => c.images.length > 0).map((c, ci) => {
                    const key = `${i}-${ci}`;
                    return (
                      <div key={ci} style={{ position: "relative", display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
                        {c.images.map((img, ii) => {
                          const zoomKey = `${i}-${ci}-${ii}`;
                          const aspect = img.width && img.height ? img.width / img.height : 4 / 3;
                          return (
                            <div
                              key={ii}
                              style={{
                                position: "relative", height: 130, width: 130 * aspect,
                                borderRadius: 10, overflow: "hidden", border: "1px solid #E8E6DC",
                                background: "#F4F2EC", flexShrink: 0,
                              }}
                            >
                              <SlideZoom
                                src={img.imageUrl}
                                alt=""
                                open={zoomOpenKey === zoomKey}
                                onClose={() => setZoomOpenKey(null)}
                              />
                              <button
                                onClick={() => setZoomOpenKey(zoomKey)}
                                aria-label="Zoom screenshot"
                                style={{
                                  position: "absolute", bottom: 6, right: 6, width: 22, height: 22, borderRadius: 6,
                                  background: "rgba(34,29,35,.65)", color: "white", border: "none",
                                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                                }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                                  <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                                  <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                                  <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
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
                  <h2 style={{
                    margin: "0 0 8px", fontSize: 18, fontWeight: 800,
                    letterSpacing: "-.02em", color: "#221D23", lineHeight: 1.25,
                  }}>
                    Recommended workflows
                  </h2>
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

              {m.role === "assistant" && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                  marginTop: 14, paddingTop: 14, borderTop: "1px solid #EEEAE4", width: "100%",
                }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#746F78", marginRight: 2 }}>Was this helpful?</span>
                  <button
                    type="button"
                    onClick={() => setFeedback((prev) => ({ ...prev, [i]: "up" }))}
                    aria-pressed={feedback[i] === "up"}
                    style={feedbackBtnStyle(feedback[i] === "up")}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 10v11" />
                      <path d="M15 5.88 14 10h6.5a1.5 1.5 0 0 1 1.45 1.87l-1.9 7.5A2 2 0 0 1 18.13 21H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
                    </svg>
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedback((prev) => ({ ...prev, [i]: "down" }))}
                    aria-pressed={feedback[i] === "down"}
                    style={feedbackBtnStyle(feedback[i] === "down")}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 14V3" />
                      <path d="M9 18.12 10 14H3.5a1.5 1.5 0 0 1-1.45-1.87l1.9-7.5A2 2 0 0 1 5.87 3H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
                    </svg>
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeamDialogFor(messages[i - 1]?.content ?? "")}
                    style={askTeamBtnStyle}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2" />
                      <path d="M2 7l10 6 10-6" />
                    </svg>
                    Ask our team
                  </button>
                </div>
              )}
            </div>
          ))}
          {loading && <AskAIThinking />}
        </div>
      </div>

      {/* Composer — sits above the message list (which shrinks to make room as it grows).
          Background matches the page (var(--bg)), not white, so it blends in rather than
          reading as a separate white panel; it still needs to be opaque so it visually
          covers scrolled messages behind it. */}
      <div style={{ position: "relative", zIndex: 20, background: "var(--bg)", padding: "16px 24px 22px", flexShrink: 0 }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>{composer(false)}</div>
      </div>

      <AskTeamDialog
        open={teamDialogFor != null}
        question={teamDialogFor ?? ""}
        sessionId={sessionId}
        onClose={() => setTeamDialogFor(null)}
      />
    </div>
  );
}

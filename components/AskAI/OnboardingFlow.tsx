"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const Q1_OPTIONS = ["Claude", "Gemini", "Copilot", "ChatGPT", "None"];
const Q1_TIER_OPTIONS = ["Free", "Paid", "Not sure"];

const TYPING_DELAY_MS = 650;

export type OnboardingExistingAnswers = {
  tool: string | null;
  toolTier: string | null;
  toolOther: string | null;
  jobFunction: string | null;
  jobFunctionOther: string | null;
  interests: string[];
  interestsOther: string | null;
};

type Props = {
  functionOptions: string[];
  categoryOptions: string[];
  existingAnswers: OnboardingExistingAnswers | null;
  /**
   * When set to "composer-chips", the option buttons render as floating chips
   * over the AskAI composer (provided by the parent shell) instead of inline
   * within the assistant messages.
   */
  uiMode?: "in-message" | "composer-chips";
  onChipsChange?: (chips: ChipsState | null) => void;
};

type Phase = 1 | 2 | 3 | "submitting" | "done";

export type ChipsState = {
  options: string[];
  selected: string[];
  multi?: boolean;
  onPick: (value: string) => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  onContinue?: () => void;
  continueStyle?: React.CSSProperties;
};

/**
 * The same 3-question onboarding survey that used to live on its own /onboarding page,
 * now asked conversationally inside Ask AI when a user hasn't completed it yet. This is
 * entirely scripted/hardcoded — no Claude call happens here. Presented like a live chat:
 * one question revealed at a time, with a brief "typing" pause before each new one, so it
 * reads as a conversation rather than a form. Options only; the small optional "Other"
 * text fields are saved (matching the original flow) but — same as before — never used
 * to filter/match workflows, only the structured picks are.
 */
export default function OnboardingFlow({
  functionOptions,
  categoryOptions,
  existingAnswers,
  uiMode = "in-message",
  onChipsChange,
}: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(1);
  const [typing, setTyping] = useState(true); // true briefly on mount too, for the very first question
  // Tracks which questions are *confirmed answered* — separate from `phase` (which only
  // advances after the typing delay). Without this, a just-answered question would
  // briefly vanish during its own typing pause, since it's no longer "live" but `phase`
  // hasn't moved to the next step yet.
  const [answeredThrough, setAnsweredThrough] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [q1Tool, setQ1Tool] = useState<string | null>(existingAnswers?.tool ?? null);
  const [q1Tier, setQ1Tier] = useState<string | null>(existingAnswers?.toolTier ?? null);
  const [q1Other, setQ1Other] = useState(existingAnswers?.toolOther ?? "");

  const [q2Function, setQ2Function] = useState<string | null>(existingAnswers?.jobFunction ?? null);
  const [q2Other, setQ2Other] = useState(existingAnswers?.jobFunctionOther ?? "");

  const [q3Interests, setQ3Interests] = useState<string[]>(existingAnswers?.interests ?? []);
  const [q3Other, setQ3Other] = useState(existingAnswers?.interestsOther ?? "");

  const [matchedCount, setMatchedCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const q2Options = [...functionOptions, "Other"];
  const q3Options = [...categoryOptions, "Other"];

  // Initial "typing" pause before the very first question appears.
  useEffect(() => {
    const t = setTimeout(() => setTyping(false), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [phase, typing, q1Tool, q2Function, q3Interests.length]);

  /** Advances to the next question with a brief "typing" pause first, like a live reply. */
  function advance(next: Phase) {
    setTyping(true);
    setTimeout(() => {
      setPhase(next);
      setTyping(false);
    }, TYPING_DELAY_MS);
  }

  function pickTool(tool: string) {
    setQ1Tool(tool);
    setQ1Tier(null);
    if (tool === "None") return; // waits for the optional text field + Continue
    // otherwise the tier question appears next, still within this same step
  }

  function pickTier(tier: string) {
    setQ1Tier(tier);
    setAnsweredThrough(1);
    advance(2);
  }

  function pickFunction(fn: string) {
    setQ2Function(fn);
    if (fn === "Other") return; // waits for optional text field + Continue
    setAnsweredThrough(2);
    advance(3);
  }

  function toggleInterest(name: string) {
    setQ3Interests((prev) => (prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]));
  }

  async function submitOnboarding() {
    setAnsweredThrough(3);
    setTyping(true);
    setErrorMsg("");

    const body = {
      tool: q1Tool,
      toolTier: q1Tool === "None" ? null : q1Tier,
      toolOther: q1Tool === "None" ? (q1Other.trim() || null) : null,
      jobFunction: q2Function,
      jobFunctionOther: q2Function === "Other" ? (q2Other.trim() || null) : null,
      interests: q3Interests,
      interestsOther: q3Interests.includes("Other") ? (q3Other.trim() || null) : null,
    };

    setTimeout(async () => {
      setPhase("submitting");
      setTyping(false);
      try {
        const res = await fetch("/api/onboarding/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) {
          setErrorMsg(json.error ?? "Something went wrong. Please try again.");
          setAnsweredThrough(2); // re-open Q3 so the user can retry
          setPhase(3);
          return;
        }
        setMatchedCount(json.matchedCount ?? 0);
        setPhase("done");
        setTimeout(() => router.push("/workflows"), 1800);
      } catch {
        setErrorMsg("Something went wrong. Please try again.");
        setAnsweredThrough(2);
        setPhase(3);
      }
    }, TYPING_DELAY_MS);
  }

  const toolSummary = q1Tool === "None"
    ? (q1Other.trim() ? `None (${q1Other.trim()})` : "None")
    : q1Tier ? `${q1Tool} — ${q1Tier}` : q1Tool;
  const functionSummary = q2Function === "Other" && q2Other.trim() ? `Other — ${q2Other.trim()}` : q2Function;
  const interestsSummary = q3Interests.includes("Other") && q3Other.trim()
    ? [...q3Interests.filter((i) => i !== "Other"), q3Other.trim()].join(", ")
    : q3Interests.join(", ");

  const isAnswered = (step: 1 | 2 | 3) => answeredThrough >= step;
  const isLive = (step: 1 | 2 | 3) => !isAnswered(step) && phase === step && !typing;
  const isVisible = (step: 1 | 2 | 3) => isAnswered(step) || isLive(step);

  const showInlineOptions = uiMode === "in-message";

  useEffect(() => {
    if (!onChipsChange) return;

    // Only show chips when a question is live and not typing.
    if (typing) { onChipsChange(null); return; }

    // Q1 — tool
    if (isLive(1) && !q1Tool) {
      onChipsChange({ options: Q1_OPTIONS, selected: [], onPick: pickTool });
      return;
    }

    // Q1 — tool was picked as "None" → allow continuing (especially for update-preferences
    // flows where values may already be set and we shouldn't dead-end).
    if (isLive(1) && q1Tool === "None") {
      onChipsChange({
        options: [],
        selected: [],
        onPick: () => {},
        continueLabel: "Continue →",
        continueDisabled: false,
        continueStyle: continueBtnStyleDark,
        onContinue: () => { setAnsweredThrough(1); advance(2); },
      });
      return;
    }

    // Q1 — tier (after tool picked, excluding None). Always show tier chips, even if
    // already selected, so update-preferences can proceed via Continue.
    if (isLive(1) && q1Tool && q1Tool !== "None") {
      onChipsChange({
        options: Q1_TIER_OPTIONS,
        selected: q1Tier ? [q1Tier] : [],
        onPick: pickTier,
        continueLabel: "Continue →",
        continueDisabled: !q1Tier,
        continueStyle: continueBtnStyleDark,
        onContinue: q1Tier ? (() => { setAnsweredThrough(1); advance(2); }) : undefined,
      });
      return;
    }

    // Q2 — function
    if (isLive(2)) {
      onChipsChange({
        options: q2Options,
        selected: q2Function ? [q2Function] : [],
        onPick: pickFunction,
        continueLabel: "Continue →",
        continueDisabled: !q2Function || q2Function === "Other",
        continueStyle: continueBtnStyleDark,
        onContinue: (q2Function && q2Function !== "Other") ? (() => { setAnsweredThrough(2); advance(3); }) : undefined,
      });
      return;
    }

    // Q3 — interests (multi + Finish)
    if (isLive(3)) {
      onChipsChange({
        options: q3Options,
        selected: q3Interests,
        multi: true,
        onPick: toggleInterest,
        continueLabel: "Finish →",
        continueDisabled: q3Interests.length === 0,
        continueStyle: continueBtnStyleDark,
        onContinue: () => { void submitOnboarding(); },
      });
      return;
    }

    onChipsChange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    typing,
    phase,
    answeredThrough,
    q1Tool,
    q1Tier,
    q2Function,
    q3Interests,
    q3Other,
    functionOptions.length,
    categoryOptions.length,
  ]);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 24px 12px", display: "flex", flexDirection: "column", gap: 20 }}>
      <AssistantRow>
        Hey! I&apos;m your AI workflow assistant. Before we dive in, let me ask a few quick
        things so I can personalize what I show you.
      </AssistantRow>

      {/* Q1 — tool (two-part: tool, then tier/None-text — each pick collapses into its
          own row instead of leaving the button group sitting there alongside a bubble
          repeating the same answer) */}
      {isVisible(1) && (
        <>
          <AssistantRow>
            First up — which AI chatbot do you use most right now?
            {showInlineOptions && isLive(1) && !q1Tool && (
              <div style={{ marginTop: 12 }}>
                <OptionButtons options={Q1_OPTIONS} selected={[]} onPick={pickTool} />
              </div>
            )}
          </AssistantRow>

          {isLive(1) && q1Tool && <UserRow>{q1Tool}</UserRow>}

          {isLive(1) && q1Tool === "None" && (
            <AssistantRow>
              No worries — want to tell me which tool you use? (optional)
              <FreeTextContinue
                value={q1Other}
                onChange={setQ1Other}
                placeholder="e.g. Amazon Q, Perplexity Enterprise"
                buttonStyle={continueBtnStyleDark}
                onContinue={() => { setAnsweredThrough(1); advance(2); }}
              />
            </AssistantRow>
          )}

          {isLive(1) && q1Tool && q1Tool !== "None" && (
            <AssistantRow>
              Got it. Free plan, or paid?
              {showInlineOptions && (
                <div style={{ marginTop: 12 }}>
                  <OptionButtons options={Q1_TIER_OPTIONS} selected={q1Tier ? [q1Tier] : []} onPick={pickTier} />
                </div>
              )}
            </AssistantRow>
          )}

          {!isLive(1) && <UserRow>{toolSummary}</UserRow>}
        </>
      )}

      {/* Q2 — function */}
      {isVisible(2) && (
        <>
          <AssistantRow>
            Nice. And what do you do day to day — your role or function?
            {showInlineOptions && isLive(2) && (
              <div style={{ marginTop: 12 }}>
                <OptionButtons options={q2Options} selected={q2Function ? [q2Function] : []} onPick={pickFunction} />
                {q2Function === "Other" && (
                  <FreeTextContinue
                    value={q2Other}
                    onChange={setQ2Other}
                    placeholder="Tell us your function"
                    buttonStyle={continueBtnStyleDark}
                    onContinue={() => { setAnsweredThrough(2); advance(3); }}
                  />
                )}
              </div>
            )}
          </AssistantRow>
          {!isLive(2) && <UserRow>{functionSummary}</UserRow>}
        </>
      )}

      {/* Q3 — interests (multi-select, always needs an explicit Finish) */}
      {isVisible(3) && (
        <>
          <AssistantRow>
            Last one — what would you like AI to actually help you with? Pick as many as apply.
            {isLive(3) && (
              <div style={{ marginTop: 12 }}>
                {showInlineOptions && (
                  <OptionButtons options={q3Options} selected={q3Interests} onPick={toggleInterest} multi />
                )}
                {q3Interests.includes("Other") && (
                  <input
                    value={q3Other}
                    onChange={(e) => setQ3Other(e.target.value)}
                    placeholder="Optional: tell us what else"
                    style={freeTextStyle}
                  />
                )}
                {showInlineOptions && (
                  <button
                    onClick={() => { void submitOnboarding(); }}
                    disabled={q3Interests.length === 0}
                    style={{ ...continueBtnStyleDark, marginTop: 12, opacity: q3Interests.length === 0 ? 0.4 : 1 }}
                  >
                    Finish →
                  </button>
                )}
                {errorMsg && <div style={{ marginTop: 10, fontSize: 12.5, color: "#DC2626", fontWeight: 600 }}>{errorMsg}</div>}
              </div>
            )}
          </AssistantRow>
          {!isLive(3) && <UserRow>{interestsSummary}</UserRow>}
        </>
      )}

      {typing && (
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <TypingIndicator />
        </div>
      )}

      {phase === "submitting" && (
        <AssistantRow>Perfect — let me match some workflows to your profile…</AssistantRow>
      )}

      {phase === "done" && (
        <AssistantRow>
          🎉 All set! I matched <strong>{matchedCount ?? 0}</strong> workflow{matchedCount === 1 ? "" : "s"} to
          your profile — taking you to My Workflows now…
        </AssistantRow>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

/** Matches AskAIChat's real assistant-message row exactly: left-aligned, no bubble background. */
function AssistantRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <div style={{ maxWidth: "100%", width: "100%", fontSize: 15, lineHeight: 1.65, color: "#221D23" }}>
        {children}
      </div>
    </div>
  );
}

/** Matches AskAIChat's real user-message row exactly: right-aligned dark bubble. */
function UserRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <div style={{
        maxWidth: "80%", padding: "10px 16px", borderRadius: 18,
        background: "#221D23", color: "white",
        fontSize: 15, lineHeight: 1.65, whiteSpace: "pre-wrap",
      }}>
        {children}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
      <span className="askai-typing-dot" style={{ animationDelay: "0ms" }} />
      <span className="askai-typing-dot" style={{ animationDelay: "150ms" }} />
      <span className="askai-typing-dot" style={{ animationDelay: "300ms" }} />
      <style>{`
        .askai-typing-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #A09AA6;
          animation: askai-typing-bounce 1s infinite ease-in-out;
        }
        @keyframes askai-typing-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: .5; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function OptionButtons({ options, selected, onPick, multi = false }: {
  options: string[];
  selected: string[];
  onPick: (value: string) => void;
  multi?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onPick(opt)}
            style={{
              padding: "9px 16px", borderRadius: 999,
              border: `1.5px solid ${isSelected ? "#221D23" : "#E8E6DC"}`,
              background: isSelected ? "#FFCE00" : "white",
              color: "#221D23", fontSize: 13.5, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {multi && (
              <span style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                border: `1.5px solid ${isSelected ? "#221D23" : "#CEC8C2"}`,
                background: isSelected ? "#221D23" : "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: "#FFCE00",
              }}>
                {isSelected && "✓"}
              </span>
            )}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function FreeTextContinue({ value, onChange, placeholder, onContinue, buttonStyle }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onContinue: () => void;
  buttonStyle?: React.CSSProperties;
}) {
  return (
    <div style={{ marginTop: 10 }}>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={freeTextStyle} />
      <button onClick={onContinue} style={{ ...(buttonStyle ?? continueBtnStyleDark), marginTop: 10 }}>Continue →</button>
    </div>
  );
}

const freeTextStyle: React.CSSProperties = {
  display: "block", width: "100%", boxSizing: "border-box",
  padding: "9px 13px", borderRadius: 10, border: "1.5px solid #E8E6DC",
  fontSize: 13.5, fontFamily: "inherit", outline: "none",
};

const continueBtnStyleDark: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 999,
  border: "1.5px solid #221D23",
  background: "#221D23",
  color: "#FFCE00",
  fontSize: 13,
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: "inherit",
};

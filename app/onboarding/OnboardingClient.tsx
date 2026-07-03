"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const AMBER = "#FFCE00";
const SHADOW = "#221D23";
const CHIFFON = "#FFF6CF";
const ORANGE = "#F68A29";
const BORDER = "#E8E6DC";
const MUTED = "#6B6B6B";

const Q1_OPTIONS = ["Claude", "Gemini", "Copilot", "ChatGPT", "None"];
const Q1_TIER_OPTIONS = ["Free", "Paid", "Not sure"];
const Q4_OPTIONS = ["Beginner", "Some experience", "Advanced"];

const LOADING_MESSAGES = [
  "Getting to know your workflow...",
  "Matching tools to how you work...",
  "Personalizing your workflow list...",
  "Almost ready...",
];

type ExistingAnswers = {
  tool: string | null;
  toolTier: string | null;
  toolOther: string | null;
  jobFunction: string | null;
  jobFunctionOther: string | null;
  interests: string[];
  interestsOther: string | null;
  experience: string | null;
};

type Props = {
  mode: "mandatory" | "update";
  functionOptions: string[];
  categoryOptions: string[];
  existingAnswers: ExistingAnswers | null;
};

type Step = 1 | 2 | 3 | 4 | "loading" | "results";

export default function OnboardingClient({ mode, functionOptions, categoryOptions, existingAnswers }: Props) {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);

  const [q1Tool, setQ1Tool] = useState<string | null>(existingAnswers?.tool ?? null);
  const [q1Tier, setQ1Tier] = useState<string | null>(existingAnswers?.toolTier ?? null);
  const [q1Other, setQ1Other] = useState(existingAnswers?.toolOther ?? "");

  const [q2Function, setQ2Function] = useState<string | null>(existingAnswers?.jobFunction ?? null);
  const [q2Other, setQ2Other] = useState(existingAnswers?.jobFunctionOther ?? "");

  const [q3Interests, setQ3Interests] = useState<string[]>(existingAnswers?.interests ?? []);
  const [q3Other, setQ3Other] = useState(existingAnswers?.interestsOther ?? "");

  const [q4Experience, setQ4Experience] = useState<string | null>(existingAnswers?.experience ?? null);

  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [matchedCount, setMatchedCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [navigatingToWorkflows, setNavigatingToWorkflows] = useState(false);

  const q2Options = [...functionOptions, "Other"];
  const q3Options = [...categoryOptions, "Other"];

  const stepNum = typeof step === "number" ? step : step === "results" ? 4 : 4;
  const progressPct = typeof step === "number" ? step * 25 : 100;

  function goTo(next: Step) { setStep(next); }

  function toggleInterest(name: string) {
    setQ3Interests(prev =>
      prev.includes(name) ? prev.filter(v => v !== name) : [...prev, name]
    );
  }

  function restart() {
    setQ1Tool(null); setQ1Tier(null); setQ1Other("");
    setQ2Function(null); setQ2Other("");
    setQ3Interests([]); setQ3Other("");
    setQ4Experience(null);
    setMatchedCount(null); setErrorMsg("");
    setStep(1);
  }

  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function submitOnboarding() {
    // button-level spinner, held long enough to actually register, before
    // handing off to the full-screen loading state
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setSubmitting(false);
    setStep("loading");
    setLoadingMsgIdx(0);
    setErrorMsg("");

    loadingIntervalRef.current = setInterval(() => {
      setLoadingMsgIdx(i => Math.min(i + 1, LOADING_MESSAGES.length - 1));
    }, 650);

    const minDelay = new Promise(resolve => setTimeout(resolve, LOADING_MESSAGES.length * 650));

    const body = {
      tool: q1Tool,
      toolTier: q1Tool === "None" ? null : q1Tier,
      toolOther: q1Tool === "None" ? (q1Other.trim() || null) : null,
      jobFunction: q2Function,
      jobFunctionOther: q2Function === "Other" ? (q2Other.trim() || null) : null,
      interests: q3Interests,
      interestsOther: q3Interests.includes("Other") ? (q3Other.trim() || null) : null,
      experience: q4Experience,
    };

    try {
      const [res] = await Promise.all([
        fetch("/api/onboarding/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        }),
        minDelay,
      ]);
      const json = await res.json();
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      if (!res.ok) {
        setErrorMsg(json.error ?? "Something went wrong. Please try again.");
        setStep(4);
        return;
      }
      setMatchedCount(json.matchedCount ?? 0);
      setStep("results");
    } catch {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      setErrorMsg("Something went wrong. Please try again.");
      setStep(4);
    }
  }

  useEffect(() => () => {
    if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
  }, []);

  function closeToWorkflows() {
    router.push("/workflows");
  }

  const toolLabel = q1Tool === "None"
    ? (q1Other.trim() || "no enterprise tool yet")
    : (q1Tool ?? "your tool");
  const toolLabelWithTier = q1Tool !== "None" && q1Tier ? `${toolLabel} (${q1Tier})` : toolLabel;
  const functionLabel = q2Function === "Other" && q2Other.trim() ? q2Other.trim() : (q2Function ?? "your function");
  const experienceLabel = q4Experience ?? "Some experience";

  return (
    <div style={{
      minHeight: "100vh", background: "#15121A",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 800, position: "relative" }}>

        {mode === "update" && typeof step === "number" && (
          <button
            onClick={closeToWorkflows}
            aria-label="Close"
            style={{
              position: "absolute", top: -44, right: 0,
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: "rgba(255,255,255,.15)", color: "white",
              fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>
        )}

        <div style={{
          textTransform: "uppercase", letterSpacing: 2.5, fontWeight: 700, fontSize: 12,
          color: ORANGE, textAlign: "center", marginBottom: 12,
        }}>
          AI Practice Lab
        </div>

        {step !== "results" && (
          <>
            <div style={{ textAlign: "center", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,.6)", marginBottom: 8 }}>
              {step === "loading" ? "Almost there" : `Question ${stepNum} of 4`}
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,.15)", borderRadius: 999, overflow: "hidden", marginBottom: 32 }}>
              <div style={{ height: "100%", background: AMBER, borderRadius: 999, width: `${progressPct}%`, transition: "width .35s ease" }} />
            </div>
          </>
        )}
        {step === "results" && (
          <>
            <div style={{ textAlign: "center", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,.6)", marginBottom: 8 }}>Your Journey</div>
            <div style={{ height: 6, background: "rgba(255,255,255,.15)", borderRadius: 999, overflow: "hidden", marginBottom: 32 }}>
              <div style={{ height: "100%", background: AMBER, borderRadius: 999, width: "100%" }} />
            </div>
          </>
        )}

        <div style={{ background: "white", borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,.35)", padding: "44px 48px", position: "relative" }}>

          {step === 1 && (
            <QuestionScreen
              title="Which AI chatbot do you currently use?"
              sub="Helps us show you the right examples."
              nextDisabled={!q1Tool}
              onNext={() => goTo(2)}
              onBack={mode === "update" ? closeToWorkflows : undefined}
              backLabel={mode === "update" ? "← Cancel" : undefined}
            >
              <OptionGrid options={Q1_OPTIONS} selected={q1Tool ? [q1Tool] : []} mode="single" onPick={v => setQ1Tool(v)} />
              {q1Tool === "None" && (
                <input
                  value={q1Other}
                  onChange={e => setQ1Other(e.target.value)}
                  placeholder="Optional: name your tool, e.g. Amazon Q, Perplexity Enterprise"
                  style={otherInputStyle}
                />
              )}
              {q1Tool && q1Tool !== "None" && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 15, color: MUTED, marginBottom: 12 }}>Free or paid version?</div>
                  <OptionGrid options={Q1_TIER_OPTIONS} selected={q1Tier ? [q1Tier] : []} mode="single" onPick={v => setQ1Tier(v)} />
                </div>
              )}
            </QuestionScreen>
          )}

          {step === 2 && (
            <QuestionScreen
              title="What do you do?"
              sub="So we can bring examples from your world."
              nextDisabled={!q2Function}
              onNext={() => goTo(3)}
              onBack={() => goTo(1)}
              backLabel="← Back"
            >
              <OptionGrid options={q2Options} selected={q2Function ? [q2Function] : []} mode="single" onPick={v => setQ2Function(v)} />
              {q2Function === "Other" && (
                <input
                  value={q2Other}
                  onChange={e => setQ2Other(e.target.value)}
                  placeholder="Tell us your function"
                  style={otherInputStyle}
                />
              )}
            </QuestionScreen>
          )}

          {step === 3 && (
            <QuestionScreen
              title="What would you like AI to help you with?"
              sub="Pick as many as you like. We'll build your list from these."
              nextDisabled={q3Interests.length === 0}
              onNext={() => goTo(4)}
              onBack={() => goTo(2)}
              backLabel="← Back"
            >
              <OptionGrid options={q3Options} selected={q3Interests} mode="multi" columns={4} onPick={toggleInterest} />
              {q3Interests.includes("Other") && (
                <input
                  value={q3Other}
                  onChange={e => setQ3Other(e.target.value)}
                  placeholder="Optional: tell us what else"
                  style={otherInputStyle}
                />
              )}
            </QuestionScreen>
          )}

          {step === 4 && (
            <QuestionScreen
              title="How comfortable are you with AI tools today?"
              sub="No wrong answer, this just sets your starting point."
              nextDisabled={!q4Experience}
              nextLabel="See My Journey →"
              nextLoading={submitting}
              onNext={submitOnboarding}
              onBack={() => goTo(3)}
              backLabel="← Back"
            >
              <OptionGrid options={Q4_OPTIONS} selected={q4Experience ? [q4Experience] : []} mode="single" onPick={v => setQ4Experience(v)} />
              {errorMsg && <div style={{ marginTop: 14, fontSize: 13, color: "#DC2626", fontWeight: 600 }}>{errorMsg}</div>}
            </QuestionScreen>
          )}

          {step === "loading" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", gap: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                border: "5px solid #E8E6DC", borderTopColor: AMBER, borderRightColor: ORANGE,
                animation: "onboarding-spin .9s linear infinite",
              }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: SHADOW, textAlign: "center", minHeight: 20 }}>
                {LOADING_MESSAGES[loadingMsgIdx]}
              </div>
            </div>
          )}

          {step === "results" && (
            <div>
              <div style={{ textAlign: "center", padding: 24 }}>
                <div style={{ fontSize: 56, fontWeight: 900, color: "#23CE68" }}>{matchedCount ?? 0}</div>
                <div style={{ fontSize: 14, color: MUTED, marginTop: 4 }}>workflow{matchedCount === 1 ? "" : "s"} matched to your journey</div>
              </div>
              <div style={{ background: SHADOW, color: "white", borderRadius: 16, padding: 32, marginBottom: 24 }}>
                <div style={{ textTransform: "uppercase", letterSpacing: 2, fontSize: 12, fontWeight: 700, color: AMBER, marginBottom: 10 }}>
                  Your Learning Journey
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.6, color: "#E8E6DC" }}>
                  Built for someone in <b style={{ color: "white" }}>{functionLabel}</b> using <b style={{ color: "white" }}>{toolLabelWithTier}</b>, at <b style={{ color: "white" }}>{experienceLabel}</b> level, focused on:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                  {q3Interests.map((tag, i) => (
                    <span key={tag} style={{
                      borderRadius: 999, padding: "5px 14px", fontSize: 13, fontWeight: 500,
                      background: TAG_COLORS[i % TAG_COLORS.length], color: i % TAG_COLORS.length === 0 ? SHADOW : "white",
                    }}>{tag}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32 }}>
                <button onClick={restart} style={ghostBtnStyle}>Start Over</button>
                <button
                  onClick={() => { setNavigatingToWorkflows(true); closeToWorkflows(); }}
                  disabled={navigatingToWorkflows}
                  style={{ ...primaryBtnStyle, opacity: navigatingToWorkflows ? 0.6 : 1, cursor: navigatingToWorkflows ? "not-allowed" : "pointer" }}
                >
                  {navigatingToWorkflows ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                      <span style={btnSpinnerStyle} />
                      Loading…
                    </span>
                  ) : "See My Workflows →"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes onboarding-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const TAG_COLORS = [AMBER, "#3696FC", "#623CEA", "#23CE68", ORANGE];

const otherInputStyle: React.CSSProperties = {
  marginTop: 12, width: "100%", boxSizing: "border-box",
  background: CHIFFON, border: "none", borderRadius: 8,
  padding: "12px 16px", fontFamily: "inherit", fontSize: 14,
};

const primaryBtnStyle: React.CSSProperties = {
  border: `1px solid ${SHADOW}`, borderRadius: 999, padding: "12px 28px",
  fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer",
  background: AMBER, color: SHADOW,
};

const btnSpinnerStyle: React.CSSProperties = {
  width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
  border: "2px solid rgba(34,29,35,.3)", borderTopColor: SHADOW,
  animation: "onboarding-spin .7s linear infinite",
};

const ghostBtnStyle: React.CSSProperties = {
  border: "none", background: "transparent", color: MUTED,
  padding: "12px 8px", fontFamily: "inherit", fontWeight: 600, fontSize: 14, cursor: "pointer",
};

function QuestionScreen({
  title, sub, children, nextDisabled, nextLabel = "Next", nextLoading = false, onNext, onBack, backLabel,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
  nextDisabled: boolean;
  nextLabel?: string;
  nextLoading?: boolean;
  onNext: () => void;
  onBack?: () => void;
  backLabel?: string;
}) {
  const disabled = nextDisabled || nextLoading;
  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, lineHeight: 1.3, color: SHADOW }}>{title}</div>
      <div style={{ fontSize: 15, color: MUTED, marginBottom: 28 }}>{sub}</div>
      {children}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32 }}>
        {onBack ? <button onClick={onBack} style={ghostBtnStyle}>{backLabel}</button> : <span />}
        <button
          onClick={onNext}
          disabled={disabled}
          style={{ ...primaryBtnStyle, opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
        >
          {nextLoading ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
              <span style={btnSpinnerStyle} />
              Loading…
            </span>
          ) : nextLabel}
        </button>
      </div>
    </div>
  );
}

function OptionGrid({ options, selected, mode, columns, onPick }: {
  options: string[];
  selected: string[];
  mode: "single" | "multi";
  columns?: number;
  onPick: (value: string) => void;
}) {
  const gridTemplateColumns = columns
    ? `repeat(${columns}, 1fr)`
    : "repeat(auto-fill, minmax(210px, 1fr))";

  return (
    <div style={{ display: "grid", gridTemplateColumns, gap: 12 }}>
      {options.map(opt => {
        const isSelected = selected.includes(opt);
        return (
          <div
            key={opt}
            onClick={() => onPick(opt)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(opt); } }}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              border: `1.5px solid ${isSelected ? SHADOW : BORDER}`,
              borderRadius: 12, padding: "16px 18px", cursor: "pointer",
              fontSize: 15, fontWeight: 600,
              background: isSelected ? AMBER : "white",
              transition: "all .15s ease",
            }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: mode === "multi" ? 6 : "50%",
              border: `2px solid ${isSelected ? SHADOW : BORDER}`,
              background: isSelected ? SHADOW : "white",
              flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {isSelected && <span style={{ color: AMBER, fontSize: 13, fontWeight: 700 }}>✓</span>}
            </span>
            {opt}
          </div>
        );
      })}
    </div>
  );
}

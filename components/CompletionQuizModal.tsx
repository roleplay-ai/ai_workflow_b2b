"use client";

import { useState, type CSSProperties } from "react";
import type { Quiz } from "@/types";

type Props = {
  activityTitle: string;
  questions: Quiz[];
  maxBonusPoints: number;
  onComplete: (scorePercent: number, bonusEarned: number) => void;
  onSkip: () => void;
};

const OPTION_LETTERS = "ABCDEFGH";

export default function CompletionQuizModal({
  activityTitle,
  questions,
  maxBonusPoints,
  onComplete,
  onSkip,
}: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [result, setResult] = useState<{ scorePercent: number; bonusEarned: number } | null>(null);

  const quiz = questions[index];
  const isLast = index >= questions.length - 1;
  const correct = selected === quiz.correct;
  const progressPct = questions.length > 0 ? Math.round(((index + (answered ? 1 : 0)) / questions.length) * 100) : 0;
  const useOptionGrid = quiz.options.length >= 4;

  const choose = (i: number) => {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    if (i === quiz.correct) setCorrectCount(c => c + 1);
  };

  const finishQuiz = (finalCorrect: number) => {
    const scorePercent = questions.length > 0 ? Math.round((finalCorrect / questions.length) * 100) : 0;
    const bonusEarned = Math.round(maxBonusPoints * (scorePercent / 100));
    setResult({ scorePercent, bonusEarned });
    onComplete(scorePercent, bonusEarned);
  };

  const advance = () => {
    if (!answered) return;
    if (!isLast) {
      setIndex(i => i + 1);
      setSelected(null);
      setAnswered(false);
      return;
    }
    finishQuiz(correctCount);
  };

  const cardShell: CSSProperties = {
    width: "100%",
    maxWidth: 720,
    maxHeight: "calc(100dvh - 24px)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: 24,
    border: "1px solid #E9E4DC",
    background: "linear-gradient(180deg, #FFFFFF 0%, #FFFBF0 100%)",
    boxShadow: "0 28px 60px -16px rgba(28,24,32,.28)",
  };

  return (
    <>
      <style>{`
        @keyframes quiz-pop {
          0%   { transform: scale(0.96) translateY(8px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes quiz-score-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .quiz-card { animation: quiz-pop 0.38s cubic-bezier(0.34, 1.25, 0.64, 1) forwards; }
        .quiz-score-ring { animation: quiz-score-pop 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) forwards; }
        .quiz-opt:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(28,24,32,.08); }
        .quiz-opt:active:not(:disabled) { transform: translateY(0); }
        .quiz-btn:hover { transform: scale(1.02); }
        .quiz-btn:active { transform: scale(0.98); }
      `}</style>

      <div
        role="dialog"
        aria-modal
        aria-labelledby="quiz-modal-title"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
          background: "rgba(28,24,32,.52)",
          backdropFilter: "blur(10px)",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div className="quiz-card" style={cardShell}>
          {result ? (
            <div style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "28px 32px 24px",
              textAlign: "center",
            }}>
              <div
                className="quiz-score-ring"
                style={{
                  width: 96,
                  height: 96,
                  marginBottom: 14,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: result.scorePercent >= 70
                    ? "linear-gradient(135deg, rgba(35,206,104,.14), rgba(255,206,0,.18))"
                    : "linear-gradient(135deg, rgba(98,60,234,.12), rgba(246,138,41,.12))",
                  border: `3px solid ${result.scorePercent >= 70 ? "#23CE68" : "#623CEA"}`,
                }}
              >
                <div>
                  <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-.04em", color: "#1C1820", lineHeight: 1 }}>
                    {result.scorePercent}%
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#746F78" }}>
                    Score
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#623CEA", marginBottom: 6 }}>
                Quiz complete
              </div>
              <h2 id="quiz-modal-title" style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900, letterSpacing: "-.03em", color: "#1C1820" }}>
                {result.scorePercent >= 70 ? "Nice work!" : "Keep learning"}
              </h2>
              <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "#746F78", lineHeight: 1.45, maxWidth: 420 }}>
                You finished the bonus quiz for <strong style={{ color: "#1C1820" }}>{activityTitle}</strong>
              </p>

              {result.bonusEarned > 0 ? (
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: "rgba(98,60,234,.08)",
                  border: "1px solid rgba(98,60,234,.18)",
                  marginBottom: 18,
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#623CEA",
                }}>
                  <span style={{ fontSize: 16 }}>⭐</span>
                  +{result.bonusEarned} bonus points
                </div>
              ) : (
                <p style={{ margin: "0 0 18px", fontSize: 13, fontWeight: 600, color: "#9A9590", lineHeight: 1.4, maxWidth: 440 }}>
                  No bonus points this round. Review the workflow and try again on your next run.
                </p>
              )}

              <button
                type="button"
                className="quiz-btn"
                onClick={onSkip}
                style={{
                  width: "100%",
                  maxWidth: 360,
                  padding: "13px 0",
                  borderRadius: 16,
                  border: 0,
                  fontWeight: 900,
                  fontSize: 14,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  color: "#1C1820",
                  background: "#FFCE00",
                  boxShadow: "0 10px 28px rgba(255,206,0,.4)",
                  transition: "transform 0.15s",
                }}
              >
                Back to Workflows
              </button>
            </div>
          ) : (
            <>
              {/* Header — fixed */}
              <div style={{ flexShrink: 0, padding: "18px 28px 0" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#623CEA", marginBottom: 4 }}>
                      Bonus quiz · optional
                    </div>
                    <h2 id="quiz-modal-title" style={{ margin: 0, fontSize: 21, fontWeight: 900, letterSpacing: "-.03em", color: "#1C1820", lineHeight: 1.15 }}>
                      Test what you learned
                    </h2>
                  </div>
                  <div style={{
                    flexShrink: 0,
                    padding: "5px 10px",
                    borderRadius: 999,
                    background: "rgba(255,206,0,.16)",
                    border: "1px solid rgba(255,206,0,.35)",
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: "#7A5F00",
                    whiteSpace: "nowrap",
                  }}>
                    +{maxBonusPoints} pts max
                  </div>
                </div>

                <div style={{ marginBottom: 4 }}>
                  <div style={{ height: 5, borderRadius: 999, background: "#EEE8DC", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${progressPct}%`,
                      borderRadius: "inherit",
                      background: "linear-gradient(90deg, #623CEA, #3699FC)",
                      transition: "width 0.35s ease",
                    }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 700, color: "#9A9590" }}>
                  <span>Question {index + 1} of {questions.length}</span>
                  <span>{correctCount} correct so far</span>
                </div>
              </div>

              {/* Body — scrolls only if content truly overflows */}
              <div style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                padding: "14px 28px 8px",
              }}>
                <div style={{
                  padding: "16px 18px",
                  borderRadius: 14,
                  background: "#fff",
                  border: "1px solid #E9E4DC",
                  marginBottom: 12,
                }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, lineHeight: 1.4, color: "#1C1820", letterSpacing: "-.01em" }}>
                    {quiz.question}
                  </p>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: useOptionGrid ? "1fr 1fr" : "1fr",
                  gap: 8,
                }}>
                  {quiz.options.map((opt, i) => {
                    const isCorrectOpt = i === quiz.correct;
                    const isSelected = i === selected;
                    let bg = "#fff";
                    let border = "#E9E4DC";
                    let color = "#1C1820";
                    let letterBg = "#F5F0E8";
                    let letterColor = "#746F78";

                    if (answered) {
                      if (isCorrectOpt) {
                        bg = "rgba(35,206,104,.08)";
                        border = "rgba(35,206,104,.35)";
                        color = "#128A45";
                        letterBg = "rgba(35,206,104,.18)";
                        letterColor = "#128A45";
                      } else if (isSelected && !correct) {
                        bg = "rgba(239,68,68,.06)";
                        border = "rgba(239,68,68,.28)";
                        color = "#B91C1C";
                        letterBg = "rgba(239,68,68,.12)";
                        letterColor = "#B91C1C";
                      } else {
                        color = "#9A9590";
                        letterBg = "#F0EBE4";
                        letterColor = "#B0ABA5";
                      }
                    }

                    return (
                      <button
                        key={i}
                        type="button"
                        className="quiz-opt"
                        disabled={answered}
                        onClick={() => choose(i)}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          width: "100%",
                          textAlign: "left",
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: `1.5px solid ${border}`,
                          background: bg,
                          color,
                          fontSize: 13.5,
                          fontWeight: 700,
                          lineHeight: 1.35,
                          cursor: answered ? "default" : "pointer",
                          fontFamily: "inherit",
                          transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s, background 0.15s",
                        }}
                      >
                        <span style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          flexShrink: 0,
                          display: "grid",
                          placeItems: "center",
                          fontSize: 11,
                          fontWeight: 900,
                          background: letterBg,
                          color: letterColor,
                        }}>
                          {answered && isCorrectOpt ? "✓" : answered && isSelected && !correct ? "✕" : OPTION_LETTERS[i]}
                        </span>
                        <span style={{ flex: 1, paddingTop: 2 }}>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {answered && (
                  <div style={{
                    marginTop: 12,
                    padding: "12px 14px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 700,
                    lineHeight: 1.4,
                    background: correct ? "rgba(35,206,104,.08)" : "rgba(246,138,41,.08)",
                    border: `1px solid ${correct ? "rgba(35,206,104,.22)" : "rgba(246,138,41,.25)"}`,
                    color: correct ? "#128A45" : "#B05000",
                  }}>
                    <strong>{correct ? "Correct!" : "Not quite."}</strong>{" "}
                    {correct ? quiz.successMsg : quiz.wrongMsg}
                  </div>
                )}
              </div>

              {/* Footer — fixed */}
              <div style={{
                flexShrink: 0,
                display: "flex",
                gap: 10,
                padding: "14px 28px 18px",
                borderTop: "1px solid #F0EBE4",
                background: "linear-gradient(180deg, rgba(255,251,240,0) 0%, #FFFBF0 100%)",
              }}>
                <button
                  type="button"
                  className="quiz-btn"
                  onClick={onSkip}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    borderRadius: 14,
                    border: "1.5px solid #E9E4DC",
                    background: "#fff",
                    color: "#746F78",
                    fontWeight: 800,
                    fontSize: 13.5,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    transition: "transform 0.15s",
                  }}
                >
                  Skip quiz
                </button>
                {answered && (
                  <button
                    type="button"
                    className="quiz-btn"
                    onClick={advance}
                    style={{
                      flex: 1.4,
                      padding: "12px 0",
                      borderRadius: 14,
                      border: 0,
                      background: "linear-gradient(135deg, #623CEA, #5030C0)",
                      color: "#fff",
                      fontWeight: 900,
                      fontSize: 13.5,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      boxShadow: "0 10px 24px rgba(98,60,234,.32)",
                      transition: "transform 0.15s",
                    }}
                  >
                    {isLast ? "See results" : "Next question →"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

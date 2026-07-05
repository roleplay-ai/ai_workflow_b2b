"use client";

import { useMemo, useState } from "react";

type Props = {
  activityTitle: string;
  points: number;
  bonusPoints?: number;
  maxQuizBonus?: number;
  showQuizOffer?: boolean;
  onTakeQuiz?: () => void;
  onContinue: () => void;
};

const CONFETTI_COLORS = ["#FFCE00", "#2563EB", "#14B8A6", "#F68A29", "#22C55E", "#221D23", "#F472B6"];

export default function CelebrationModal({
  activityTitle,
  points,
  bonusPoints = 0,
  maxQuizBonus = 0,
  showQuizOffer = false,
  onTakeQuiz,
  onContinue,
}: Props) {
  const [loading, setLoading] = useState(false);

  const confetti = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: `${(i * 17 + 7) % 100}%`,
        delay: `${(i % 12) * 0.12}s`,
        duration: `${2.2 + (i % 5) * 0.35}s`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 6 + (i % 4) * 2,
        rotate: (i * 47) % 360,
        shape: i % 3 === 0 ? "50%" : i % 3 === 1 ? "2px" : "0",
      })),
    [],
  );

  return (
    <>
      <style>{`
        @keyframes cel-fall {
          0%   { transform: translateY(-12vh) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0.2; }
        }
        @keyframes cel-pop {
          0%   { transform: scale(0.5);  opacity: 0; }
          60%  { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes cel-emoji {
          0%,100% { transform: scale(1)    rotate(-6deg); }
          25%     { transform: scale(1.15) rotate(6deg);  }
          50%     { transform: scale(1.05) rotate(-4deg); }
          75%     { transform: scale(1.12) rotate(4deg);  }
        }
        @keyframes cel-spin {
          to { transform: rotate(360deg); }
        }
        .cel-card  { animation: cel-pop   0.45s cubic-bezier(0.34,1.4,0.64,1) forwards; }
        .cel-emoji { animation: cel-emoji 1.2s ease-in-out infinite; }
        .cel-piece { position: absolute; top: -12px; animation-name: cel-fall; animation-timing-function: linear; animation-iteration-count: infinite; }
        .cel-spin  { animation: cel-spin 0.7s linear infinite; }
        .cel-btn:hover  { transform: scale(1.02); }
        .cel-btn:active { transform: scale(0.98); }
      `}</style>

      {/* Backdrop */}
      <div
        role="dialog"
        aria-modal
        aria-labelledby="celebration-title"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          overflow: "hidden",
          background: "rgba(15,23,42,.5)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Confetti */}
        <div
          aria-hidden
          style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}
        >
          {confetti.map((c) => (
            <span
              key={c.id}
              className="cel-piece"
              style={{
                left: c.left,
                animationDelay: c.delay,
                animationDuration: c.duration,
                background: c.color,
                width: c.size,
                height: c.shape === "50%" ? c.size : c.size * 0.45,
                borderRadius: c.shape,
                transform: `rotate(${c.rotate}deg)`,
              }}
            />
          ))}
        </div>

        {/* Card */}
        <div
          className="cel-card"
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            maxWidth: 448,
            borderRadius: 24,
            padding: 32,
            textAlign: "center",
            background: "linear-gradient(180deg,#fff 0%,#FFFBEB 100%)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.8)",
          }}
        >
          {/* Emoji */}
          <div
            className="cel-emoji"
            aria-hidden
            style={{ fontSize: 48, marginBottom: 12, display: "block", lineHeight: 1 }}
          >
            🎉
          </div>

          {/* Subtitle */}
          <div style={{
            fontSize: 11,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 8,
            color: "#B45309",
          }}>
            All steps completed
          </div>

          {/* Title */}
          <h2
            id="celebration-title"
            style={{
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              marginBottom: 8,
              color: "#221D23",
            }}
          >
            You did it!
          </h2>

          {/* Description */}
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "#64748B" }}>
            You finished <strong style={{ color: "#221D23" }}>{activityTitle}</strong>
          </p>

          {/* Points */}
          {points > 0 || bonusPoints > 0 ? (
            <div style={{ marginBottom: showQuizOffer ? 16 : 24 }}>
              {points > 0 && (
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: bonusPoints > 0 ? 4 : 0, color: "#2563EB" }}>
                  +{points} points earned
                </p>
              )}
              {bonusPoints > 0 && (
                <p style={{ fontSize: 14, fontWeight: 700, color: "#623CEA" }}>
                  +{bonusPoints} bonus quiz points
                </p>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: showQuizOffer ? 16 : 24 }} />
          )}

          {showQuizOffer && maxQuizBonus > 0 && (
            <p style={{ fontSize: 13, fontWeight: 600, color: "#64748B", marginBottom: 16, lineHeight: 1.45 }}>
              Optional: take a quick quiz to earn up to <strong style={{ color: "#2563EB" }}>+{maxQuizBonus}</strong> bonus points.
            </p>
          )}

          {showQuizOffer && onTakeQuiz ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                type="button"
                className="cel-btn"
                onClick={onTakeQuiz}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  borderRadius: 16,
                  border: 0,
                  fontWeight: 900,
                  fontSize: 14,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  color: "#fff",
                  background: "linear-gradient(135deg,#2563EB,#1D4ED8)",
                  boxShadow: "0 10px 28px rgba(37,99,235,.35)",
                  transition: "transform 0.15s",
                }}
              >
                Take bonus quiz (+{maxQuizBonus} pts max)
              </button>
              <button
                type="button"
                className="cel-btn"
                onClick={() => { if (loading) return; setLoading(true); onContinue(); }}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  borderRadius: 16,
                  border: "1.5px solid #E8E6DC",
                  fontWeight: 800,
                  fontSize: 14,
                  fontFamily: "inherit",
                  cursor: loading ? "default" : "pointer",
                  color: "#6B6B6B",
                  background: "white",
                  transition: "transform 0.15s",
                }}
              >
                {loading ? "Going to Workflows…" : "Skip quiz — back to Workflows"}
              </button>
            </div>
          ) : (
          /* CTA button */
          <button
            type="button"
            className="cel-btn"
            onClick={() => { if (loading) return; setLoading(true); onContinue(); }}
            style={{
              width: "100%",
              padding: "14px 0",
              borderRadius: 16,
              border: 0,
              fontWeight: 900,
              fontSize: 14,
              fontFamily: "inherit",
              cursor: loading ? "default" : "pointer",
              color: "#221D23",
              background: "#FFCE00",
              boxShadow: "0 10px 28px rgba(255,206,0,.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              transition: "transform 0.15s",
            }}
          >
            {loading ? (
              <>
                <span
                  className="cel-spin"
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    border: "2.5px solid rgba(34,29,35,.2)",
                    borderTopColor: "#221D23",
                    borderRadius: "50%",
                  }}
                />
                Going to Workflows…
              </>
            ) : (
              "Back to Workflows"
            )}
          </button>
          )}
        </div>
      </div>
    </>
  );
}

"use client";
import { useEffect, useState } from "react";
import { trackFluencyView } from "@/lib/trackFluencyView";

type Props = {
  moduleId: string;
  moduleTitle: string;
  moduleEmoji: string;
  onClose: () => void;
};

export default function ModuleHtmlModal({ moduleId, moduleTitle, moduleEmoji, onClose }: Props) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    trackFluencyView("module", moduleId);
  }, [moduleId]);

  // Trigger pop-in animation after mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Reset loading state on module change
  useEffect(() => {
    setIframeLoaded(false);
  }, [moduleId]);

  // Fallback in case iframe never fires onLoad
  useEffect(() => {
    const t = window.setTimeout(() => setIframeLoaded(true), 12000);
    return () => window.clearTimeout(t);
  }, [moduleId]);

  // ESC to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 220);
  }

  return (
    <>
      <style>{`
        @keyframes mhm-backdrop-in  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mhm-backdrop-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes mhm-card-in  { from { opacity: 0; transform: translateY(28px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes mhm-card-out { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(18px) scale(0.97); } }
        @keyframes mhm-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.85); }
        }
        .mhm-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #623CEA; animation: mhm-pulse 1.1s ease-in-out infinite; }
        .mhm-dot:nth-child(2) { animation-delay: 0.18s; }
        .mhm-dot:nth-child(3) { animation-delay: 0.36s; }
        .mhm-close:hover { background: rgba(34,29,35,.12) !important; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(10,8,14,.65)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px",
          animation: `${visible ? "mhm-backdrop-in" : "mhm-backdrop-out"} 220ms ease forwards`,
        }}
      >
        {/* Modal card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 960,
            height: "92vh",
            maxHeight: 860,
            borderRadius: 20,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            background: "#FAFAF8",
            boxShadow: "0 40px 100px rgba(0,0,0,.45), 0 0 0 1px rgba(255,255,255,.08)",
            fontFamily: "Inter, system-ui, sans-serif",
            animation: `${visible ? "mhm-card-in" : "mhm-card-out"} 240ms cubic-bezier(0.34,1.1,0.64,1) forwards`,
          }}
        >
          {/* Coloured accent strip at very top */}
          <div style={{
            height: 4, flexShrink: 0,
            background: "linear-gradient(90deg, #623CEA 0%, #3699FC 50%, #23CE6B 100%)",
          }} />

          {/* Header */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 16px",
            borderBottom: "1px solid #EAE6DF",
            background: "#fff",
            flexShrink: 0,
          }}>
            {/* Emoji badge */}
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: "linear-gradient(135deg, #F1ECFF 0%, #EAF5FF 100%)",
              border: "1px solid rgba(98,60,234,.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16,
            }}>
              {moduleEmoji}
            </div>

            {/* Title + breadcrumb */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#A09AA6", marginBottom: 1 }}>
                AI Foundations
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#1C1820", letterSpacing: "-.02em", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {moduleTitle}
              </div>
            </div>

            {/* Close */}
            <div style={{ flexShrink: 0 }}>
              <button
                className="mhm-close"
                onClick={handleClose}
                aria-label="Close"
                style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: "rgba(34,29,35,.06)",
                  border: "1px solid #EAE6DF",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#1C1820", flexShrink: 0,
                  transition: "background .12s",
                  padding: 0, fontFamily: "inherit",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
            {/* Loading overlay */}
            {!iframeLoaded && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 2,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 16, background: "#FAFAF8",
              }}>
                {/* Emoji pulse */}
                <div style={{
                  width: 64, height: 64, borderRadius: 18,
                  background: "linear-gradient(135deg, #F1ECFF 0%, #EAF5FF 100%)",
                  border: "1px solid rgba(98,60,234,.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 30, marginBottom: 4,
                }}>
                  {moduleEmoji}
                </div>

                {/* Bouncing dots */}
                <div style={{ display: "flex", gap: 6 }}>
                  <span className="mhm-dot" />
                  <span className="mhm-dot" />
                  <span className="mhm-dot" />
                </div>

                <span style={{ fontSize: 13, fontWeight: 600, color: "#A09AA6" }}>
                  Loading {moduleTitle}…
                </span>
              </div>
            )}

            <iframe
              src={`/api/fluency/module/${moduleId}/html`}
              style={{
                border: "none",
                width: "100%",
                height: "100%",
                display: "block",
                opacity: iframeLoaded ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title={moduleTitle}
              onLoad={() => setIframeLoaded(true)}
            />
          </div>
        </div>
      </div>
    </>
  );
}

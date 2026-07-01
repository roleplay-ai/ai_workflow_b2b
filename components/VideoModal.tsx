"use client";
import { useState, useRef, useCallback } from "react";

function videoKind(url: string): "youtube" | "vimeo" | "direct" {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/vimeo\.com/.test(url)) return "vimeo";
  return "direct";
}

function toEmbedUrl(url: string, kind: "youtube" | "vimeo"): string {
  if (kind === "youtube") {
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}?rel=0&autoplay=1` : url;
  }
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}?autoplay=1` : url;
}

export default function VideoModal({ src, activityTitle, alreadyWatched, onClose, onCompleted }: {
  src: string; activityTitle: string; alreadyWatched: boolean; onClose: () => void; onCompleted: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const firedRef = useRef(alreadyWatched);
  const [completed, setCompleted] = useState(alreadyWatched);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const kind = videoKind(src);
  const isEmbed = kind !== "direct";

  const fire = useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    setCompleted(true);
    onCompleted();
  }, [onCompleted]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    const labels: Record<number, string> = { 1: "Playback aborted", 2: "Network error", 3: "Decoding error", 4: "Video not found" };
    setVideoError(labels[vid.error?.code ?? 0] ?? "Unknown error");
    setIsLoading(false);
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes vm-fade-in{from{opacity:0}to{opacity:1}} @keyframes vm-slide-up{from{transform:translateY(24px) scale(.97);opacity:0}to{transform:none;opacity:1}} @keyframes vm-pop{0%{transform:scale(0)}65%{transform:scale(1.15)}100%{transform:scale(1)}}`}</style>
      <div
        role="dialog" aria-modal aria-label={`Video: ${activityTitle}`}
        style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(8,10,20,.92)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "vm-fade-in .2s ease" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <button onClick={onClose} aria-label="Close video"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 65, width: 38, height: 38, borderRadius: 12, border: 0, background: "rgba(255,255,255,.13)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, cursor: "pointer" }}>✕</button>

        <div style={{ width: "min(92vw, 980px)", display: "flex", flexDirection: "column", gap: 14, animation: "vm-slide-up .3s cubic-bezier(.22,1,.36,1)" }}>
          <div style={{ textAlign: "center", fontSize: 13.5, fontWeight: 700, color: "rgba(255,255,255,.65)" }}>🎬 {activityTitle}</div>
          <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", background: "#000", boxShadow: "0 36px 90px rgba(0,0,0,.7)", minHeight: 240 }}>
            {isLoading && !videoError && !isEmbed && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "rgba(255,255,255,.5)", fontSize: 13, fontWeight: 600 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" strokeOpacity=".2"/><path d="M12 2a10 10 0 0 1 10 10" style={{ animation: "spin 1s linear infinite" }} strokeLinecap="round"/></svg>
                Loading video…
              </div>
            )}
            {videoError ? (
              <div style={{ padding: "40px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
                <div style={{ fontSize: 36 }}>⚠️</div>
                <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>Couldn&apos;t load the video</div>
                <div style={{ color: "rgba(255,255,255,.55)", fontSize: 13 }}>{videoError}</div>
              </div>
            ) : isEmbed ? (
              <iframe src={toEmbedUrl(src, kind)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen style={{ width: "100%", aspectRatio: "16/9", border: 0, display: "block" }} title={activityTitle} onLoad={() => setIsLoading(false)} />
            ) : (
              <video ref={videoRef} src={src} controls controlsList="nodownload" preload="metadata" crossOrigin="anonymous" playsInline onCanPlay={() => setIsLoading(false)} onEnded={() => fire()} onError={handleError} style={{ width: "100%", display: "block", maxHeight: "70vh", outline: "none" }} />
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
            {completed ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 999, background: "rgba(34,197,94,.15)", border: "1px solid rgba(34,197,94,.35)", color: "#4ADE80", fontSize: 12.5, fontWeight: 700, animation: "vm-pop .35s cubic-bezier(.34,1.56,.64,1)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Video complete — activity marked as done
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)", fontWeight: 500 }}>{isEmbed ? "Embedded video · mark as watched when done" : "Auto-completes when video finishes"}</div>
            )}
            {!completed && (
              <button onClick={() => fire()} style={{ padding: "6px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.75)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✓ Mark as watched</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

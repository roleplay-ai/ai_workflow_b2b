"use client";

import { useRef, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { TOTAL_MODULES } from "@/lib/ai-mastery-course";
import styles from "./mastery.module.css";

type Props = {
  completedModules: string[];
  userName: string | null;
  hasAccess: boolean;
  accessRequested: boolean;
};

export default function MasteryClient({
  completedModules: initial,
  userName,
  hasAccess,
  accessRequested,
}: Props) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [completed, setCompleted] = useState<string[]>(initial);
  const [requested, setRequested] = useState(accessRequested);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [saving, startSave] = useTransition();
  const prevRef = useRef<Set<string>>(new Set(initial));

  useEffect(() => {
    if (!hasAccess) return;
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== "ai-mastery-progress") return;
      const incoming: string[] = e.data.completedModules ?? [];
      const added = incoming.filter(id => !prevRef.current.has(id));
      const removed = [...prevRef.current].filter(id => !incoming.includes(id));
      setCompleted(incoming);
      prevRef.current = new Set(incoming);
      startSave(async () => {
        await Promise.all([
          ...added.map(id =>
            fetch("/api/ai-mastery/progress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ moduleId: id }),
            })
          ),
          ...removed.map(id =>
            fetch("/api/ai-mastery/progress", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ moduleId: id }),
            })
          ),
        ]);
      });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [hasAccess]);

  const pct = Math.round((completed.length / TOTAL_MODULES) * 100);

  function closeCourse() {
    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }
    router.push("/updates#ai-foundations");
  }

  async function requestAccess() {
    if (requesting || requested) return;
    setRequesting(true);
    setRequestError("");
    try {
      const response = await fetch("/api/ai-mastery/request-access", { method: "POST" });
      if (!response.ok) throw new Error("Could not request access");
      setRequested(true);
    } catch {
      setRequestError("Could not send your request. Please try again.");
    } finally {
      setRequesting(false);
    }
  }

  if (!hasAccess) {
    return (
      <main style={{
        minHeight: "100vh",
        padding: "clamp(24px, 6vw, 72px) 20px",
        background: "#FEFCFA",
        color: "#221D23",
        display: "grid",
        placeItems: "center",
      }}>
        <section style={{
          width: "min(760px, 100%)",
          padding: "clamp(26px, 5vw, 52px)",
          border: "1px solid #E8E3DA",
          borderRadius: 24,
          background: "#fff",
          boxShadow: "0 20px 60px rgba(34,29,35,.08)",
          textAlign: "center",
        }}>
          <Image src="/icon.png" alt="" width={68} height={68} style={{ display: "block", margin: "0 auto 20px" }} />
          <span style={{
            display: "inline-flex",
            padding: "6px 10px",
            borderRadius: 999,
            background: "#FFF6CF",
            border: "1px solid #EAD993",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: ".09em",
            textTransform: "uppercase",
          }}>
            AI Mastery
          </span>
          <h1 style={{
            margin: "14px auto 12px",
            maxWidth: 600,
            fontSize: "clamp(32px, 6vw, 54px)",
            lineHeight: 1.02,
            letterSpacing: "-.05em",
          }}>
            Build practical confidence with AI
          </h1>
          <p style={{
            maxWidth: 570,
            margin: "0 auto 24px",
            color: "#746F78",
            fontSize: 15,
            lineHeight: 1.55,
          }}>
            The full guided course covers AI foundations, prompting, research, data,
            presentations, agents, building, safety, and what comes next.
          </p>
          <div style={{
            maxWidth: 520,
            margin: "0 auto 26px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 8,
          }}>
            {["30 modules", "Progress saved", "Practical examples"].map((item) => (
              <span key={item} style={{
                padding: "10px 8px",
                borderRadius: 11,
                background: "#FAFAF8",
                border: "1px solid #EEEAE3",
                fontSize: 11,
                fontWeight: 700,
              }}>
                {item}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={requesting || requested}
              onClick={() => void requestAccess()}
              style={{
                minHeight: 42,
                padding: "0 18px",
                border: 0,
                borderRadius: 10,
                background: requested ? "#E9E6E0" : "#111",
                color: requested ? "#746F78" : "#fff",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 750,
                cursor: requesting || requested ? "default" : "pointer",
              }}
            >
              {requesting ? "Requesting…" : requested ? "Access requested" : "Request course access"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/updates#ai-foundations")}
              style={{
                minHeight: 42,
                padding: "0 18px",
                border: "1px solid #E5E1DA",
                borderRadius: 10,
                background: "#fff",
                color: "#221D23",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Back to Learn
            </button>
          </div>
          {requestError ? <p role="status" style={{ margin: "14px 0 0", color: "#B42318", fontSize: 12 }}>{requestError}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <div className={styles.coursePage}>

      {/* Top bar */}
      <div className={styles.courseTopbar}>
        {/* Left: back + title */}
        <div className={styles.courseTopbarLeft}>
          <button
            onClick={closeCourse}
            className={styles.closeButton}
            aria-label="Close course"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 2L4 7l5 5" />
            </svg>
            <span>Close course</span>
          </button>
          <div className={styles.divider} />
          <div className={styles.courseIdentity}>
            <Image src="/icon.png" alt="" width={24} height={24} style={{ display: "block", flexShrink: 0 }} />
            <span className={styles.courseTitle}>
              AI Mastery Course
            </span>
            {userName && (
              <span className={styles.courseUser}>
                · {userName.split(" ")[0]}
              </span>
            )}
          </div>
        </div>

        {/* Right: progress */}
        <div className={styles.courseProgress}>
          {saving && <span className={styles.saving}>Saving…</span>}
          <span className={styles.moduleCount}>
            {completed.length} / {TOTAL_MODULES}
          </span>
          <div className={styles.progressTrack}>
            <div style={{
              width: `${pct}%`,
            }} />
          </div>
          <span className={styles.progressPercent}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Course iframe */}
      <iframe
        ref={iframeRef}
        title="AI Mastery Course"
        src="/api/ai-mastery/content"
        className={styles.courseFrame}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
}

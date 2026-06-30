"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

function safeRedirect(raw: string | null): string {
  if (!raw) return "/workflows";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return "/workflows";
    return url.pathname + url.search;
  } catch {
    return "/workflows";
  }
}

const inputBase: React.CSSProperties = {
  padding: "11px 14px", borderRadius: 9,
  border: "1.5px solid #E5DFD8", fontSize: 14, outline: "none",
  width: "100%", boxSizing: "border-box",
  fontFamily: "inherit", background: "#FAFAF8",
  color: "#14111A", transition: "border-color .15s, box-shadow .15s",
};

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [redirectTo, setRedirectTo] = useState("/workflows");
  const [focused, setFocused]   = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectTo(safeRedirect(params.get("redirect")));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    window.location.href = redirectTo;
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 480px", fontFamily: "Inter, system-ui, sans-serif", background: "#14111A" }}>

      {/* ── LEFT: brand panel ── */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", padding: "48px 64px", overflow: "hidden" }}>

        {/* Glows */}
        <div style={{ position: "absolute", top: "10%", left: "20%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(98,60,234,.22) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "5%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,206,0,.10) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, rgba(255,255,255,.04) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        {/* Logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nudgeable-logo.png" alt="Nudgeable" style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>Nudgeable</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.35)", fontWeight: 600, letterSpacing: ".05em" }}>AI PRACTICE LAB</div>
            </div>
          </div>
          {/* Chip anchored below logo */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 18, background: "rgba(255,206,0,.08)", border: "1px solid rgba(255,206,0,.18)", borderRadius: 999, padding: "6px 14px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFCE00", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,206,0,.9)", letterSpacing: ".03em" }}>Enterprise AI adoption platform</span>
          </div>
        </div>

        {/* Hero copy */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1, maxWidth: 560 }}>


          <h1 style={{ margin: "0 0 20px", color: "#fff", fontSize: "clamp(38px, 3.8vw, 56px)", fontWeight: 600, lineHeight: 1.04, letterSpacing: "-.055em" }}>
            Build an AI-ready<br />
            <span style={{ color: "#FFCE00", textShadow: "0 0 40px rgba(255,206,0,.25)" }}>workforce</span>, faster.
          </h1>

          <p style={{ margin: "0 0 52px", color: "rgba(255,255,255,.45)", fontSize: 16, fontWeight: 450, lineHeight: 1.65, maxWidth: 440 }}>
            Structured AI practice, curated weekly updates, and a 30-module mastery
            course — everything your team needs to go from AI-aware to AI-capable.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", marginBottom: 52 }}>
            {[
              { value: "80+", label: "AI Workflows" },
              { value: "30", label: "Mastery modules" },
              { value: "Weekly", label: "AI briefings" },
            ].map((s, i) => (
              <div key={s.label} style={{ flex: 1, paddingRight: 24, marginRight: 24, borderRight: i < 2 ? "1px solid rgba(255,255,255,.08)" : "none" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#FFCE00", letterSpacing: "-.04em", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.38)", fontWeight: 600, marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { icon: "⊞", text: "Role-mapped workflow library across Claude, Gemini, Copilot & more" },
              { icon: "✦", text: "Self-paced AI Mastery course with progress synced across your team" },
              { icon: "◎", text: "Weekly briefings: AI news, launch videos, and workplace perspectives" },
            ].map((f) => (
              <div key={f.text} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: "rgba(255,206,0,.07)", border: "1px solid rgba(255,206,0,.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFCE00", fontSize: 15 }}>
                  {f.icon}
                </div>
                <p style={{ margin: 0, paddingTop: 6, fontSize: 13.5, color: "rgba(255,255,255,.5)", fontWeight: 500, lineHeight: 1.5 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 22 }}>
          <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,.28)", fontWeight: 500 }}>
            © 2025 Nudgeable · Enterprise plan · Invite-only access
          </p>
        </div>
      </div>

      {/* ── RIGHT: same background, card floats ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px" }}>

        {/* Login card */}
        <div style={{ width: "100%", maxWidth: 360, background: "#fff", borderRadius: 20, border: "1px solid rgba(0,0,0,.06)", boxShadow: "0 8px 48px rgba(0,0,0,.32), 0 2px 8px rgba(0,0,0,.14)", padding: "36px 32px 30px" }}>

          <div style={{ marginBottom: 26 }}>
            <h2 style={{ margin: "0 0 5px", fontSize: 22, fontWeight: 800, letterSpacing: "-.04em", color: "#14111A" }}>Sign in</h2>
            <p style={{ margin: 0, color: "#8C8595", fontSize: 13.5, fontWeight: 500 }}>Welcome back to your workspace.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: "#4A4452" }}>Work email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                placeholder="you@company.com" required
                style={{ ...inputBase, borderColor: focused === "email" ? "#623CEA" : "#E5DFD8", boxShadow: focused === "email" ? "0 0 0 3px rgba(98,60,234,.09)" : "none" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: "#4A4452" }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                placeholder="••••••••" required minLength={6}
                style={{ ...inputBase, borderColor: focused === "password" ? "#623CEA" : "#E5DFD8", boxShadow: focused === "password" ? "0 0 0 3px rgba(98,60,234,.09)" : "none" }}
              />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "#FFF2F2", border: "1px solid #FFCDD0", color: "#C0392B", fontSize: 13, fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{ marginTop: 4, padding: "13px 24px", borderRadius: 10, border: 0, background: "#14111A", color: "#FFCE00", fontWeight: 800, fontSize: 14, cursor: loading ? "default" : "pointer", opacity: loading ? .65 : 1, fontFamily: "inherit", transition: "transform .12s, box-shadow .12s", boxShadow: "0 2px 8px rgba(20,17,26,.18)" }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(20,17,26,.28)"; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(20,17,26,.18)"; }}
            >
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          <p style={{ margin: "22px 0 0", fontSize: 12, color: "#B0A8B8", fontWeight: 500, lineHeight: 1.6, textAlign: "center" }}>
            Access is invite-only. Contact your admin<br />if you don&apos;t have an account yet.
          </p>

        </div>
      </div>

    </div>
  );
}

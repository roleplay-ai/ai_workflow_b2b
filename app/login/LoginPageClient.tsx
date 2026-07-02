"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPostLoginPath } from "@/lib/auth/postLogin";
import type { Role } from "@/lib/supabase/types";
import ToolIcon from "@/components/ToolIcon";
import { formatToolLabel } from "@/lib/tools";
import type { ToolLogoMap } from "@/lib/toolLogos";
import styles from "./login.module.css";

const PRIMARY_TOOLS = ["claude", "copilot", "gemini", "chatgpt"] as const;

const PRODUCT_PILLARS = [
  {
    label: "AI Workflows",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFCE00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <circle cx="12" cy="18" r="2.5" />
        <path d="M8.2 7.4l3.3 8.2M15.8 7.4l-3.3 8.2" />
      </svg>
    ),
  },
  {
    label: "AI Mastery Course",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFCE00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
      </svg>
    ),
  },
  {
    label: "Weekly AI Updates",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFCE00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    ),
  },
] as const;

export type FeaturedTag = {
  id: string;
  name: string;
  icon_url: string | null;
  featured_description: string | null;
};

type Props = {
  toolLogos: ToolLogoMap;
  featuredTags: FeaturedTag[];
};

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
  padding: "11px 14px",
  borderRadius: 9,
  border: "1.5px solid #E5DFD8",
  fontSize: 14,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
  background: "#FAFAF8",
  color: "#14111A",
  transition: "border-color .15s, box-shadow .15s",
};

function FeaturedTagCarouselItem({ tag }: { tag: FeaturedTag }) {
  return (
    <div className={styles.featuredTagItem}>
      {tag.icon_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tag.icon_url}
          alt={tag.name}
          width={34}
          height={34}
          style={{ borderRadius: "50%", objectFit: "cover", display: "block", flexShrink: 0 }}
        />
      ) : (
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "rgba(255,255,255,.08)",
            border: "1px solid rgba(255,255,255,.12)",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            fontWeight: 800,
            color: "rgba(255,255,255,.7)",
          }}
        >
          {tag.name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <span
        style={{
          fontSize: 9.5,
          fontWeight: 600,
          color: "rgba(255,255,255,.42)",
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: 58,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {tag.name}
      </span>
    </div>
  );
}

function ProductPillar({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className={styles.featurePill}>
      <div className={styles.featureIcon}>{icon}</div>
      <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.88)", letterSpacing: "-.01em" }}>
        {label}
      </span>
    </div>
  );
}

export default function LoginPageClient({ toolLogos, featuredTags }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [redirectTo, setRedirectTo] = useState("/workflows");
  const [focused, setFocused] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectTo(safeRedirect(params.get("redirect")));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = user
      ? await supabase.from("profiles").select("role").eq("id", user.id).single()
      : { data: null };

    const role = (profile?.role ?? "user") as Role;
    window.location.href = getPostLoginPath(role, redirectTo);
  }

  const marqueeTags = featuredTags.length > 0 ? [...featuredTags, ...featuredTags] : [];

  return (
    <div className={styles.page}>
      <div className={styles.brandPanel}>
        <div
          style={{
            position: "absolute",
            top: "8%",
            left: "18%",
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(98,60,234,.22) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "12%",
            right: "4%",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,206,0,.10) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className={styles.brandHeader}>
          <div className={styles.brandLogoRow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nudgeable-logo.png" alt="Nudgeable" style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>Nudgeable</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.35)", fontWeight: 600, letterSpacing: ".05em" }}>
                AI PRACTICE LAB
              </div>
            </div>
          </div>
          <div className={styles.brandBadge}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFCE00", display: "inline-block" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,206,0,.9)", letterSpacing: ".03em" }}>
              Enterprise AI adoption platform
            </span>
          </div>
        </div>

        <div className={styles.hero}>
          <h1 className={styles.headline}>
            Practice AI for real workplace{" "}
            <span style={{ color: "#FFCE00", textShadow: "0 0 40px rgba(255,206,0,.25)" }}>outcomes.</span>
          </h1>

          <p className={styles.subtext}>
            Outcome-based workflows across chatbots, AI work apps, and specialized tools.
          </p>

          <p className={styles.sectionLabel}>WORKS ACROSS YOUR AI STACK</p>

          <div className={styles.primaryGrid}>
            {PRIMARY_TOOLS.map(tool => (
              <div key={tool} className={styles.primaryCard}>
                <ToolIcon tool={tool} size={42} logos={toolLogos} insetScale={0.88} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.82)", letterSpacing: "-.01em" }}>
                  {formatToolLabel(tool)}
                </span>
              </div>
            ))}
          </div>

          {marqueeTags.length > 0 && (
            <div className={styles.marqueeOuter}>
              <div className={styles.marqueeTrack}>
                {marqueeTags.map((tag, i) => (
                  <FeaturedTagCarouselItem key={`${tag.id}-${i}`} tag={tag} />
                ))}
              </div>
            </div>
          )}

          <div className={styles.productRow}>
            {PRODUCT_PILLARS.map(pillar => (
              <ProductPillar key={pillar.label} label={pillar.label} icon={pillar.icon} />
            ))}
          </div>
        </div>

        <div className={styles.brandFooter}>
          <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,.28)", fontWeight: 500 }}>
            © 2025 Nudgeable · Enterprise plan · Invite-only access
          </p>
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Sign in</h2>
            <p className={styles.formSubtitle}>Welcome back to your workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: "#4A4452" }}>Work email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                placeholder="you@company.com"
                required
                style={{
                  ...inputBase,
                  borderColor: focused === "email" ? "#623CEA" : "#E5DFD8",
                  boxShadow: focused === "email" ? "0 0 0 3px rgba(98,60,234,.09)" : "none",
                }}
              />
            </div>
            <div className={styles.field}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: "#4A4452" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  style={{
                    ...inputBase,
                    paddingRight: 42,
                    borderColor: focused === "password" ? "#623CEA" : "#E5DFD8",
                    boxShadow: focused === "password" ? "0 0 0 3px rgba(98,60,234,.09)" : "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 2,
                    color: "#9E98A6",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#FFF2F2",
                  border: "1px solid #FFCDD0",
                  color: "#C0392B",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 2,
                padding: "14px 24px",
                borderRadius: 10,
                border: 0,
                background: "#14111A",
                color: "#FFCE00",
                fontWeight: 800,
                fontSize: 14,
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.65 : 1,
                fontFamily: "inherit",
                transition: "transform .12s, box-shadow .12s",
                boxShadow: "0 2px 8px rgba(20,17,26,.18)",
              }}
              onMouseEnter={e => {
                if (!loading) {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(20,17,26,.28)";
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(20,17,26,.18)";
              }}
            >
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          <p className={styles.formFooter}>
            Invite-only access. Contact your admin if you don&apos;t have an account.
          </p>
        </div>
      </div>
    </div>
  );
}

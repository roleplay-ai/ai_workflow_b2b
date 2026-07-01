"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  companyName: string | null;
  companyInitials: string;
  userName: string | null;
  userEmail: string | null;
  userInitials: string;
};

function NavItem({
  href,
  icon,
  label,
  badge,
  badgeColor = "amber",
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
  badgeColor?: "amber" | "red";
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 12px", margin: "1px 8px",
        borderRadius: 7, fontSize: 13, fontWeight: 650,
        color: active ? "#FFCE00" : "rgba(255,255,255,.55)",
        background: active ? "rgba(255,206,0,.13)" : "transparent",
        transition: "background .12s, color .12s",
        textDecoration: "none",
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,.07)";
          (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,.85)";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
          (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,.55)";
        }
      }}
    >
      <span style={{ flexShrink: 0, opacity: active ? 1 : 0.7, display: "flex" }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && (
        <span style={{
          fontSize: 10, fontWeight: 800,
          background: badgeColor === "red" ? "#ED4551" : "#FFCE00",
          color: badgeColor === "red" ? "#fff" : "#1C1820",
          borderRadius: 999, padding: "2px 7px",
        }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: ".09em",
      textTransform: "uppercase", color: "rgba(255,255,255,.3)",
      padding: "14px 18px 5px",
    }}>
      {children}
    </div>
  );
}

export default function B2BSidebar({ companyName, companyInitials, userName, userEmail, userInitials }: Props) {
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <aside style={{
      width: "var(--sidebar-w)", minHeight: "100vh",
      background: "#1C1820",
      display: "flex", flexDirection: "column", flexShrink: 0,
      position: "fixed", top: 0, left: 0, bottom: 0,
      zIndex: 50, overflowY: "auto",
    }}>
      {/* Brand */}
      <div style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "18px 16px 14px",
        borderBottom: "1px solid rgba(255,255,255,.08)",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/nudgeable-logo.png" alt="Nudgeable" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: "#fff", letterSpacing: "-.01em" }}>Nudgeable</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.4)", marginTop: 1 }}>AI Practice Lab</div>
        </div>
      </div>

      {/* Workspace pill */}
      {companyName && (
        <div style={{
          margin: "12px 12px 6px",
          background: "rgba(255,255,255,.07)",
          border: "1px solid rgba(255,255,255,.1)",
          borderRadius: 7, padding: "8px 10px",
          display: "flex", alignItems: "center", gap: 9,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: "#623CEA",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, color: "#fff", flexShrink: 0,
          }}>
            {companyInitials}
          </div>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", flex: 1 }}>{companyName}</span>
          <span style={{
            fontSize: 9.5, fontWeight: 700, color: "#FFCE00",
            background: "rgba(255,206,0,.12)",
            border: "1px solid rgba(255,206,0,.25)",
            borderRadius: 999, padding: "2px 6px",
          }}>PRO</span>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, paddingBottom: 12 }}>
        <SectionLabel>Practice</SectionLabel>

        <NavItem
          href="/workflows"
          badge="New"
          label="Workflows"
          icon={
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2"/>
              <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2"/>
              <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2"/>
              <rect x="9" y="9" width="5.5" height="5.5" rx="1.2"/>
            </svg>
          }
        />

        <NavItem
          href="/mastery"
          label="AI Mastery"
          icon={
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 1.5L10 6h4.5L11 9l1.5 4.5L8 11l-4.5 2.5L5 9 1.5 6H6z"/>
            </svg>
          }
        />

        <NavItem
          href="/updates"
          label="AI Updates"
          badge={3}
          badgeColor="red"
          icon={
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="6.5"/>
              <path d="M8 5v3l2 2"/>
            </svg>
          }
        />

      </nav>

      {/* Free guide card */}
      <div style={{ margin: "0 10px 12px", background: "#0F0D12", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "10px" }}>
        {/* Label + title row */}
        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".1em", textTransform: "uppercase", color: "#FFCE00", marginBottom: 3 }}>
          Free Download
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 900, color: "#fff", lineHeight: 1.3, marginBottom: 6, letterSpacing: "-.01em" }}>
          Prompt Engineering for AI Agents
        </div>

        {/* Description */}
        <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.45)", fontWeight: 500, lineHeight: 1.45, marginBottom: 8 }}>
          30 techniques, 4 modules &amp; a 12-step workflow for writing AI agent prompts that work.
        </div>

        {/* Download button */}
        <a
          href="/prompt-engineering-guide.pdf"
          download="PromptEngineering_FieldGuide.pdf"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "7px 0", background: "#FFCE00", color: "#1C1820", borderRadius: 6, fontSize: 11, fontWeight: 900, textDecoration: "none", boxSizing: "border-box" }}
        >
          Download Guide
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </a>
      </div>

      {/* User footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", padding: "12px 12px 14px", position: "relative" }}>

        {/* Sign-out popover */}
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 49 }}
            />
            <div style={{
              position: "absolute", bottom: "calc(100% + 6px)", left: 12, right: 12,
              background: "#2A2430", border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 10, padding: "6px",
              zIndex: 51, boxShadow: "0 8px 32px rgba(0,0,0,.45)",
            }}>
              <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid rgba(255,255,255,.08)", marginBottom: 6 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{userName ?? "User"}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontWeight: 500 }}>{userEmail}</div>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "9px 10px", borderRadius: 7,
                  background: "transparent", border: "none", cursor: signingOut ? "default" : "pointer",
                  color: "#FF6B6B", fontSize: 13, fontWeight: 700, textAlign: "left",
                  fontFamily: "inherit", opacity: signingOut ? 0.6 : 1,
                  transition: "background .12s",
                }}
                onMouseEnter={e => { if (!signingOut) (e.currentTarget as HTMLElement).style.background = "rgba(255,107,107,.10)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3"/>
                  <path d="M11 11l3-3-3-3"/>
                  <path d="M14 8H6"/>
                </svg>
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </>
        )}

        {/* Profile row */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 9, width: "100%",
            padding: "7px 6px", borderRadius: 7,
            background: menuOpen ? "rgba(255,255,255,.09)" : "transparent",
            border: "none", cursor: "pointer", textAlign: "left",
            transition: "background .12s",
          }}
          onMouseEnter={e => { if (!menuOpen) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.06)"; }}
          onMouseLeave={e => { if (!menuOpen) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: "50%", background: "#623CEA",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: "#fff", flexShrink: 0,
          }}>
            {userInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userName ?? "User"}
            </div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.4)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userEmail}
            </div>
          </div>
          <svg
            style={{ color: "rgba(255,255,255,.3)", flexShrink: 0, transition: "transform .15s", transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"
          >
            <path d="M3 5l4 4 4-4"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}

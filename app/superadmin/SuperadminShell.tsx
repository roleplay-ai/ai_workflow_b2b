"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

type Props = {
  profile: Profile & { companies: { id: string; name: string } | null };
  children: React.ReactNode;
};

const NAV_SECTIONS = [
  {
    label: "Content",
    items: [
      {
        label: "Activities",
        href: "/superadmin",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        ),
        exact: true,
      },
      {
        label: "AI Fluency",
        href: "/superadmin/ai-fluency",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        ),
      },
      {
        label: "AI Mastery Access",
        href: "/superadmin/aimastery-access",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
      },
      {
        label: "Knowledge Base",
        href: "/superadmin/knowledge-base",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        ),
      },
      {
        label: "Ask AI Queries",
        href: "/superadmin/ask-ai-logs",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        label: "Companies",
        href: "/superadmin/companies",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
        ),
      },
      {
        label: "Users",
        href: "/superadmin/users",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        label: "Categories",
        href: "/superadmin/categories",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        ),
      },
      {
        label: "Functions",
        href: "/superadmin/functions",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M2 10h20" />
            <path d="M8 14h2" />
            <path d="M14 14h2" />
          </svg>
        ),
      },
      {
        label: "Tool Logos",
        href: "/superadmin/tool-logos",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        ),
      },
      {
        label: "Featured Tags",
        href: "/superadmin/featured-tags",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        label: "Overview",
        href: "/superadmin/analytics",
        exact: true,
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
      },
      {
        label: "Apply Analytics",
        href: "/superadmin/analytics/apply",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        ),
      },
      {
        label: "Know Analytics",
        href: "/superadmin/analytics/know",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ),
      },
    ],
  },
];

export default function SuperadminShell({ profile, children }: Props) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  const initials = profile.full_name
    ? profile.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : (profile.email ?? "?")[0].toUpperCase();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8F8F6", fontFamily: "Roboto, ui-sans-serif, system-ui, sans-serif" }}>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.2)", zIndex: 199 }} />
      )}

      {/* Sidebar */}
      <aside className={`sa-sidebar ${sidebarOpen ? "sa-sidebar-open" : ""}`} style={{
        width: 260,
        background: "#1A161B",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        bottom: 0,
        zIndex: 200,
        transition: "transform .2s ease",
      }}>
        {/* Brand */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <Link href="/apply" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/nudgeable-logo.png" alt="Nudgeable" style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,.85)", letterSpacing: "-.02em" }}>
              AI Practice Lab
            </span>
          </Link>
        </div>

        {/* Superadmin badge */}
        <div style={{ padding: "14px 16px 6px" }}>
          <div style={{
            padding: "8px 12px",
            background: "linear-gradient(135deg, #623CEB 0%, #8B5CF6 100%)",
            borderRadius: 10, color: "white",
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", opacity: .7, marginBottom: 2 }}>
              Superadmin
            </div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Platform Management</div>
          </div>
        </div>

        {/* Nav sections */}
        <nav style={{ flex: 1, padding: "4px 10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.3)", padding: "14px 10px 6px" }}>
                {section.label}
              </div>
              {section.items.map(item => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px", borderRadius: 9, textDecoration: "none",
                      fontSize: 13, fontWeight: active ? 800 : 600,
                      color: active ? "#FFCE00" : "rgba(255,255,255,.55)",
                      background: active ? "rgba(255,206,0,.1)" : "transparent",
                      transition: "all .15s ease",
                      marginBottom: 1,
                    }}
                  >
                    <span style={{ display: "flex", opacity: active ? 1 : .5 }}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", padding: 10 }}>
          <Link href="/admin" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", borderRadius: 9, marginBottom: 6,
            fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.5)",
            textDecoration: "none",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Admin Panel
          </Link>
          <Link href="/apply" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", borderRadius: 9, marginBottom: 6,
            fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.5)",
            textDecoration: "none",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Back to App
          </Link>

          {/* User profile */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 9, background: "rgba(255,255,255,.05)",
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", background: "#623CEB",
              color: "white", display: "grid", placeItems: "center",
              fontSize: 11, fontWeight: 800, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile.full_name ?? profile.email}
              </div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.35)" }}>superadmin</div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              style={{
                width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(255,255,255,.1)",
                background: "transparent", cursor: "pointer", display: "grid", placeItems: "center",
                color: "rgba(255,255,255,.4)", flexShrink: 0, padding: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, marginLeft: 260, minWidth: 0 }}>
        {/* Mobile header */}
        <div className="sa-mobile-header" style={{
          display: "none", position: "sticky", top: 0, zIndex: 100,
          height: 56, padding: "0 16px", background: "rgba(26,22,27,.98)",
          borderBottom: "1px solid rgba(255,255,255,.08)", backdropFilter: "blur(18px)",
          alignItems: "center", justifyContent: "space-between",
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              width: 38, height: 38, borderRadius: 10, border: "1px solid rgba(255,255,255,.1)",
              background: "transparent", cursor: "pointer", display: "grid", placeItems: "center",
              padding: 0, color: "white",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span style={{ fontSize: 14, fontWeight: 800, color: "white" }}>Superadmin</span>
          <div style={{ width: 38 }} />
        </div>

        <main style={{ padding: "28px 32px 60px", maxWidth: 1680, margin: "0 auto" }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sa-mobile-header { display: flex !important; }
          .sa-sidebar { transform: translateX(-100%); }
          .sa-sidebar.sa-sidebar-open { transform: translateX(0); }
          div[style*="marginLeft: 260"] { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
